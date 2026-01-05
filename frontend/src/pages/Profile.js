import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Edit, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

const Profile = () => {
  const { user, familyProfile } = useAuth();
  const navigate = useNavigate();

  if (!familyProfile) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-fraunces text-2xl font-bold text-[#264653] mb-4">
            Complete Your Profile
          </h2>
          <p className="text-[#5F6F75] mb-6">
            Set up your family profile to connect with other homeschool families
          </p>
          <Link to="/onboarding">
            <Button className="btn-primary">Set Up Profile</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6" data-testid="profile-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-fraunces text-2xl sm:text-3xl font-bold text-[#264653]">
            My Profile
          </h1>
          <Button variant="outline" onClick={() => navigate('/settings')} data-testid="edit-profile-btn">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#2A9D8F]/10 to-[#E9C46A]/10">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-[#2A9D8F] flex items-center justify-center text-white text-2xl font-bold">
                {familyProfile.family_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="font-fraunces text-2xl font-bold text-[#264653]">
                  {familyProfile.family_name}
                </h2>
                <p className="text-[#5F6F75] flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {familyProfile.city}, {familyProfile.state} {familyProfile.zip_code}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  {user?.email_verified && (
                    <span className="badge-verified">
                      ✓ Email Verified
                    </span>
                  )}
                  {user?.id_verified && (
                    <span className="badge-verified">
                      ✓ ID Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {familyProfile.bio && (
            <div className="p-6 sm:p-8 border-b border-[#E0E0E0]">
              <h3 className="font-semibold text-[#264653] mb-2">About Us</h3>
              <p className="text-[#5F6F75]">{familyProfile.bio}</p>
            </div>
          )}

          {/* Kids */}
          {familyProfile.kids?.length > 0 && (
            <div className="p-6 sm:p-8 border-b border-[#E0E0E0]">
              <h3 className="font-semibold text-[#264653] mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2A9D8F]" />
                Our Children
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {familyProfile.kids.map((kid, index) => (
                  <div key={index} className="p-3 bg-[#F4F1DE] rounded-lg">
                    <p className="font-medium text-[#264653]">{kid.name}</p>
                    <p className="text-sm text-[#5F6F75]">{kid.age} years old</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {familyProfile.interests?.length > 0 && (
            <div className="p-6 sm:p-8">
              <h3 className="font-semibold text-[#264653] mb-3">Our Interests</h3>
              <div className="flex flex-wrap gap-2">
                {familyProfile.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/events/create">
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 flex items-center gap-4 card-hover">
              <div className="w-12 h-12 rounded-lg bg-[#2A9D8F]/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#2A9D8F]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#264653]">Host an Event</h4>
                <p className="text-sm text-[#5F6F75]">Create a meetup for families</p>
              </div>
            </div>
          </Link>
          <Link to="/discover">
            <div className="bg-white rounded-xl border border-[#E0E0E0] p-4 flex items-center gap-4 card-hover">
              <div className="w-12 h-12 rounded-lg bg-[#E76F51]/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#E76F51]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#264653]">Find Families</h4>
                <p className="text-sm text-[#5F6F75]">Connect with nearby families</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
