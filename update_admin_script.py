import re

with open("c:/Users/sharm/OneDrive/OneDrive/study material/Listenlink main/client/src/pages/AdminPanel.jsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "const [dashboard, setDashboard] = useState(null);",
    "const [dashboard, setDashboard] = useState(null);\n    const [pendingEducations, setPendingEducations] = useState([]);"
)

content = content.replace(
    "adminService.getUniversityPosts(),",
    "adminService.getUniversityPosts(),\n          adminService.getPendingEducation(),"
)

content = content.replace(
    "const [dashboardData, postsData] = await Promise.all([",
    "const [dashboardData, postsData, pendingEduData] = await Promise.all(["
)

content = content.replace(
    "setUniversityPosts(postsData.posts || []);",
    "setUniversityPosts(postsData.posts || []);\n        if (pendingEduData && pendingEduData.pending) { setPendingEducations(pendingEduData.pending); }"
)

new_pending_tab = '''        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800"><UserCheck className="inline w-5 h-5 mr-1" /> Pending Education Validations</h2>
                <p className="text-sm text-slate-500">Approve students and alumni who claimed to study here</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left p-3 font-semibold text-slate-600">User</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Program / Info</th>
                    <th className="text-left p-3 font-semibold text-slate-600">Type</th>
                    <th className="text-right p-3 font-semibold text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEducations.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-8 text-slate-500">No pending validations!</td>
                    </tr>
                  ) : pendingEducations.map((edu, idx) => (
                    <tr key={`${edu.user_id}-${edu.edu_id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{edu.user_name}</div>
                        <div className="text-xs text-slate-500">{edu.user_email}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        Batch: {edu.entry_year} - {edu.passing_year || 'Present'}<br/>
                        <span className="text-xs text-slate-400">Edu ID: {edu.edu_id.substring(0,8)}...</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${edu.enrollment_status === 'alumni' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                          {edu.enrollment_status === 'alumni' ? 'Alumni' : 'Student'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          disabled={actionLoading === edu.edu_id}
                          onClick={async () => {
                            try {
                              setActionLoading(edu.edu_id);
                              await adminService.processEducationApproval(edu.user_id, edu.edu_id, 'approve');
                              setMessage('Education approved successfully!');
                              loadDashboard();
                            } catch (e) {
                              setError(e.response?.data?.detail || 'Failed to approve');
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          className="mr-2 inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </button>
                        <button 
                          disabled={actionLoading === edu.edu_id}
                          onClick={async () => {
                            if (window.confirm('Reject this education claim?')) {
                              try {
                                setActionLoading(edu.edu_id);
                                await adminService.processEducationApproval(edu.user_id, edu.edu_id, 'reject');
                                setMessage('Education rejected.');
                                loadDashboard();
                              } catch (e) {
                                setError(e.response?.data?.detail || 'Failed to reject');
                              } finally {
                                setActionLoading(null);
                              }
                            }
                          }}
                          className="inline-flex items-center text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}'''

start = content.find(" {activeTab === 'pending'")
end = content.find(")}", start)

# To be safe, let's use regex
pattern = re.compile(r"\{activeTab === 'pending' && \([\s\S]*?\n\s*\)\}", re.MULTILINE)
content = pattern.sub(new_pending_tab, content)

with open("c:/Users/sharm/OneDrive/OneDrive/study material/Listenlink main/client/src/pages/AdminPanel.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated")
