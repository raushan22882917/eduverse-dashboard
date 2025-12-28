import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StudentSidebar from '@/components/StudentSidebar';
import VirtualLabs from '@/pages/VirtualLabs';
import { supabase } from '@/integrations/supabase/client';

const StudentVirtualLabs: React.FC = () => {
  const { user } = useAuth();
  const [classGrade, setClassGrade] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return;

      try {
        const { data: studentProfile, error } = await supabase
          .from("student_profiles")
          .select("class_grade")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          // Handle 406 error specifically
          if (error.code === 'PGRST406' || error.message?.includes('406')) {
            // Fallback: try without .maybeSingle()
            const { data: fallbackData } = await supabase
              .from("student_profiles")
              .select("class_grade")
              .eq("user_id", user.id)
              .limit(1);

            if (fallbackData && fallbackData.length > 0 && fallbackData[0].class_grade) {
              setClassGrade(fallbackData[0].class_grade);
            }
          } else if (error.code !== "PGRST116") {
            console.error("Error fetching student profile:", error);
          }
        } else if (studentProfile?.class_grade) {
          setClassGrade(studentProfile.class_grade);
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <StudentSidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <VirtualLabs userId={user?.id || ''} userGrade={classGrade} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentVirtualLabs;