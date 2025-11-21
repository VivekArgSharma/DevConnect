import React from "react";

const Profile = () => {
  // Placeholder data – replace with real backend user data later
  const user = {
    name: "John Doe",
    email: "johndoe@gmail.com",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff&size=256"
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 py-20">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center border border-gray-200">
        
        {/* Avatar */}
        <img
          src={user.avatar}
          alt="profile avatar"
          className="w-32 h-32 rounded-full mx-auto mb-6 shadow-md object-cover"
        />

        {/* Name */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user.name}
        </h1>

        {/* Email */}
        <p className="text-gray-600 text-lg mb-6">{user.email}</p>

        <div className="text-gray-700">
          <p className="text-sm">
            This is your profile page. Later, when backend is ready, this page
            will display all your posts, projects, and settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
