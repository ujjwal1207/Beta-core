import React from 'react';
import { useAppContext } from '../context/AppContext';

const SearchScreen = ({ query }) => {
  // You can add actual search logic here (API call, filter, etc.)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>
      <p className="text-slate-600">You searched for: <span className="font-semibold">{query}</span></p>
      {/* TODO: Render search results here */}
    </div>
  );
};

export default SearchScreen;
