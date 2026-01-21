import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Video, VideoOff, Mic, MicOff, PhoneOff, User, Minimize2 } from 'lucide-react';
import { callsService } from '../../services';

import { useAppContext } from '../../context/AppContext';

// Remote video player component defined outside to prevent remounting
const RemoteVideoPlayer = ({ remoteUser, recipientName }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    console.log('📺 RemoteVideoPlayer effect for:', remoteUser?.uid);
    if (remoteUser?.videoTrack && ref.current) {
      console.log('▶️ Playing remote video track');
      remoteUser.videoTrack.play(ref.current);
      
      // Ensure playsinline for iOS (must be done AFTER play creates the element)
      setTimeout(() => {
        const videoElement = ref.current?.querySelector('video');
        if (videoElement) {
          videoElement.setAttribute('playsinline', 'true');
          videoElement.setAttribute('webkit-playsinline', 'true');
        }
      }, 100);
    } else {
      console.log('⚠️ No video track or ref for remote user');
    }
    
    return () => {
      if (remoteUser?.videoTrack) {
        // Don't stop the track here, just let it be handled by unpublish/leave
        // remoteUser.videoTrack.stop(); 
      }
    };
  }, [remoteUser, remoteUser?.videoTrack]);

  if (!remoteUser?.videoTrack) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl border border-slate-700">
            <VideoOff className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-1">Camera Off</h3>
          <p className="text-slate-400 text-sm">{recipientName || 'User'} has turned off their camera</p>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="w-full h-full object-cover" style={{ width: '100%', height: '100%' }} />;
};

/**
 * VideoCallScreen - Agora-powered video/voice calling component
 * Uses direct SDK approach with useRef for synchronous track handling
 * 
 * @param {Object} props
 * @param {Object} props.recipientUser - The user object to call
 * @param {string} props.channelName - The Agora channel name to join
 * @param {string} props.token - Optional pre-existing Agora token (for scheduled calls)
 * @param {number} props.uid - Optional pre-existing Agora UID (for scheduled calls)
 * @param {string} props.appId - Optional pre-existing Agora App ID (for scheduled calls)
 * @param {Function} props.onCallEnd - Callback when call ends
 */
const VideoCallScreen = ({ recipientUser, channelName, token, uid, appId, onCallEnd }) => {
  // Get voice call setting from context if not available in props
  const { isVoiceCall, setInVideoCall, setIsCallMinimized, setCallState, setCallControls } = useAppContext();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(!isVoiceCall); // Start with camera off for voice calls
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef(0);

  // Refs for synchronous access (avoids React state closure issues)
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const localVideoRef = useRef(null);
  const hasPublishedRef = useRef(false);
  const isVideoPublishedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const isJoiningRef = useRef(false); // Track if join is in progress
  
  // Keep latest onCallEnd callback available in effects
  const onCallEndRef = useRef(onCallEnd);
  useEffect(() => {
    onCallEndRef.current = onCallEnd;
  }, [onCallEnd]);

  // Timer effect - also update shared call state
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => {
        const newDuration = prev + 1;
        callDurationRef.current = newDuration;
        return newDuration;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync call state to shared context (separate effect to avoid render issues)
  useEffect(() => {
    setCallState(prevState => ({ 
      ...prevState, 
      duration: callDuration,
      isMicOn,
      isCameraOn
    }));
  }, [callDuration, isMicOn, isCameraOn, setCallState]);

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize call
  useEffect(() => {
    let isMounted = true;
    console.log('🔄 VideoCallScreen effect running for recipient:', recipientUser?.id);

    const initCall = async () => {
      if (!recipientUser?.id) return;

      // Skip if already initializing
      if (isInitializingRef.current) {
        console.log('⚠️ Already initializing, skipping...');
        return;
      }
      
      // Skip if client already exists and is connected/connecting
      if (clientRef.current) {
        const state = clientRef.current.connectionState;
        if (state === 'CONNECTED' || state === 'CONNECTING') {
          console.log(`⚠️ Client already ${state}, skipping init...`);
          return;
        }
      }
      
      isInitializingRef.current = true;
      
      try {
        // Get Agora credentials
        // Use provided token/uid if available (for scheduled calls), otherwise fetch new ones
        const targetChannel = channelName || recipientUser.id;
        console.log('📞 Joining channel:', targetChannel);
        
        let agoraCredentials;
        if (token && uid) {
          console.log('📞 Using provided scheduled call credentials');
          agoraCredentials = {
            app_id: appId || import.meta.env.VITE_AGORA_APP_ID || 'your_app_id',
            channel_name: targetChannel,
            token: token,
            uid: uid
          };
        } else {
          console.log('📞 Fetching new Agora credentials for channel:', targetChannel);
          agoraCredentials = await callsService.getAgoraToken(targetChannel);
        }
        
        const { app_id, channel_name, token: agoraToken, uid: agoraUid } = agoraCredentials;

        if (!isMounted) return;

        // Create client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // Set up event listeners BEFORE joining
        client.on('user-joined', (user) => {
          console.log('User joined:', user.uid);
          setRemoteUsers((prev) => {
            if (prev.find(u => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        });

        client.on('user-published', async (remoteUser, mediaType) => {
          console.log(`📡 User published: ${remoteUser.uid} [${mediaType}]`);
          await client.subscribe(remoteUser, mediaType);
          console.log(`✅ Subscribed to: ${remoteUser.uid} [${mediaType}]`);
          
          if (mediaType === 'video') {
            setRemoteUsers((prev) => {
              const index = prev.findIndex(u => u.uid === remoteUser.uid);
              if (index !== -1) {
                // Update existing user with new video track
                const newUsers = [...prev];
                newUsers[index] = remoteUser;
                return newUsers;
              }
              return [...prev, remoteUser];
            });
          }
          
          if (mediaType === 'audio' && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }
        });

        client.on('user-unpublished', (remoteUser, mediaType) => {
          console.log(`User unpublished: ${remoteUser.uid} [${mediaType}]`);
          if (mediaType === 'video') {
            // Don't remove user, just update state to reflect track removal
            setRemoteUsers((prev) => {
              return prev.map(u => u.uid === remoteUser.uid ? remoteUser : u);
            });
          }
          // Do not remove user if only audio is unpublished
        });

        client.on('user-left', (remoteUser, reason) => {
          console.log(`User left: ${remoteUser.uid}, reason: ${reason}`);
          setRemoteUsers((prev) => prev.filter(u => u.uid !== remoteUser.uid));
          
          // If the remote user leaves (quits), end the call locally as well
          if (reason === 'Quit' || reason === 'ServerTimeOut') {
            console.log('Remote user left, ending call...');
            // Use ref to call the latest callback without stale closure
            if (onCallEndRef.current) {
              onCallEndRef.current(callDurationRef.current);
            }
          }
        });

        // Create tracks (both at once to ensure they're ready together)
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { echoCancellation: true, noiseSuppression: true },
          { encoderConfig: { width: 640, height: 480, frameRate: 15 } }
        );

        if (!isMounted) {
          audioTrack.close();
          videoTrack.close();
          return;
        }

        // Store in refs for synchronous access
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Set initial video state based on call type
        if (isVoiceCall) {
          await videoTrack.setEnabled(false);
          setIsCameraOn(false);
        }

        // Join channel
      isJoiningRef.current = true; // Mark join as in progress
      await client.join(app_id, channel_name, agoraToken, Number(agoraUid));
      
      if (!isMounted) {
        isJoiningRef.current = false;
        return;
      }
      hasJoinedRef.current = true;
      isJoiningRef.current = false; // Join completed

        // Publish tracks
        if (isVoiceCall) {
          await client.publish([audioTrack]);
          isVideoPublishedRef.current = false;
        } else {
          await client.publish([audioTrack, videoTrack]);
          isVideoPublishedRef.current = true;
        }
        
        hasPublishedRef.current = true;
        console.log('✅ Successfully published tracks');

        setLoading(false);
      } catch (err) {
        console.error('❌ Call initialization error:', err);
        setError(err.message);
        setLoading(false);
      } finally {
        isJoiningRef.current = false; // Ensure flag is reset
      }
    };

    initCall();

    // Cleanup
    return () => {
      isMounted = false;
      isInitializingRef.current = false;
      hasJoinedRef.current = false;
      isJoiningRef.current = false; // Reset join flag
      
      console.log('🧹 Cleaning up video call...');
      
      // Async cleanup to avoid race conditions
      const cleanup = async () => {
        try {
          // Wait a bit to let any pending operations complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (localAudioTrackRef.current) {
            try {
              localAudioTrackRef.current.stop();
              localAudioTrackRef.current.close();
            } catch (e) {
              console.warn('Audio track cleanup error:', e);
            }
          }
          
          if (localVideoTrackRef.current) {
            try {
              localVideoTrackRef.current.stop();
              localVideoTrackRef.current.close();
            } catch (e) {
              console.warn('Video track cleanup error:', e);
            }
          }
          
          if (clientRef.current) {
            try {
              await clientRef.current.leave();
              clientRef.current.removeAllListeners();
            } catch (e) {
              console.warn('Client cleanup error:', e);
            }
          }
          
          console.log('✅ Cleanup complete');
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      };
      
      cleanup();
    };
  }, [recipientUser?.id]);

  // Play local video once UI is ready
  useEffect(() => {
    if (!loading && localVideoTrackRef.current && localVideoRef.current) {
      console.log('🎥 Playing local video track');
      localVideoTrackRef.current.play(localVideoRef.current);
      
      // Ensure the video element has playsInline for iOS
      setTimeout(() => {
        const videoElement = localVideoRef.current?.querySelector('video');
        if (videoElement) {
          videoElement.setAttribute('playsinline', 'true');
          videoElement.setAttribute('webkit-playsinline', 'true');
        }
      }, 100);
    }
  }, [loading, remoteUsers.length]); // Re-run if remote users change (to handle PIP switching)

  // Toggle controls - use useCallback to create stable references
  const toggleCamera = useCallback(async () => {
    if (localVideoTrackRef.current) {
      const newState = !isCameraOn;
      
      try {
        if (newState) {
          // Turning camera ON
          await localVideoTrackRef.current.setEnabled(true);
          
          // Publish if not yet published
          if (!isVideoPublishedRef.current && clientRef.current) {
            await clientRef.current.publish([localVideoTrackRef.current]);
            isVideoPublishedRef.current = true;
          }
        } else {
          // Turning camera OFF
          await localVideoTrackRef.current.setEnabled(false);
        }
        setIsCameraOn(newState);
      } catch (err) {
        console.error('Error toggling camera:', err);
      }
    }
  }, [isCameraOn]);

  const toggleMic = useCallback(async () => {
    if (localAudioTrackRef.current) {
      const newState = !isMicOn;
      await localAudioTrackRef.current.setEnabled(newState);
      setIsMicOn(newState);
    }
  }, [isMicOn]);

  // Expose toggle functions to context for minimized widget
  useEffect(() => {
    const maximizeCall = () => {
      setIsCallMinimized(false);
      setInVideoCall(true);
    };
    
    setCallControls({
      toggleMic,
      toggleCamera,
      endCall: () => onCallEnd(callDuration),
      maximizeCall
    });
  }, [toggleMic, toggleCamera, onCallEnd, callDuration, setIsCallMinimized, setInVideoCall, setCallControls]);

  const endCall = useCallback(() => {
    onCallEnd(callDuration);
  }, [onCallEnd, callDuration]);

  const handleMinimize = useCallback(() => {
    setIsCallMinimized(true);
  }, [setIsCallMinimized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Connecting to call...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500 text-xl mb-4">❌ {error}</div>
        <button
          onClick={onCallEnd}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col h-screen overflow-hidden">
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="absolute top-6 right-6 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors"
        aria-label="Minimize call"
      >
        <Minimize2 className="w-5 h-5 text-white" />
      </button>

      {/* Call Timer */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
        <span className="text-white font-mono text-sm tracking-wider font-medium">
          {formatTime(callDuration)}
        </span>
      </div>

      {/* Remote Video Area (or Local Mirror if waiting) */}
      <div className="flex-1 relative bg-slate-900">
        {remoteUsers.length > 0 ? (
          <RemoteVideoPlayer 
            key={remoteUsers[0].uid} 
            remoteUser={remoteUsers[0]} 
            recipientName={recipientUser?.full_name || recipientUser?.name}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            {/* Show local video as background when waiting */}
            <div ref={localVideoRef} className="absolute inset-0 w-full h-full object-cover opacity-50" style={{ width: '100%', height: '100%' }} />
            
            <div className="z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-slate-800/80 animate-pulse flex items-center justify-center mb-4 backdrop-blur-sm">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-sm font-medium tracking-widest uppercase opacity-80 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                Waiting for {recipientUser?.full_name || recipientUser?.name || 'user'}...
              </p>
            </div>
          </div>
        )}

        {/* Local Video PIP (Only show if remote user is present) */}
        {remoteUsers.length > 0 && (
          <div className="absolute top-6 right-6 w-32 h-44 bg-black rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-20">
            <div ref={localVideoRef} className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} style={{ width: '100%', height: '100%' }} />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <VideoOff className="w-6 h-6 text-slate-500" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="pb-12 pt-6 px-10 flex justify-center items-center gap-6 bg-gradient-to-t from-slate-950 to-transparent absolute bottom-0 left-0 right-0 z-30">
        <button 
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${!isMicOn ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isMicOn ? <Mic /> : <MicOff />}
        </button>

        <button 
          onClick={endCall}
          className="p-6 bg-red-600 text-white rounded-full shadow-xl hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
        >
          <PhoneOff className="w-8 h-8" />
        </button>

        <button 
          onClick={toggleCamera}
          className={`p-4 rounded-full transition-all ${!isCameraOn ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isCameraOn ? <Video /> : <VideoOff />}
        </button>
      </div>
    </div>
  );
};

export default VideoCallScreen;
