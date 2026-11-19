import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export type DemoRole = 'student' | 'teacher' | 'admin';

export const createDemoUser = (role: DemoRole = 'student'): User => {
  const profileDetails = {
    student: {
      id: 'demo-student-id-123',
      name: 'Alex Demo Student',
      email: 'demo.student@eduverse.ai',
      school: 'EduVerse Demo Academy',
      grade: 10
    },
    teacher: {
      id: 'demo-teacher-id-123',
      name: 'Prof. Sarah Demo Teacher',
      email: 'demo.teacher@eduverse.ai',
      school: 'EduVerse Demo Academy',
      grade: null
    },
    admin: {
      id: 'demo-admin-id-123',
      name: 'Dr. Arthur Demo Admin',
      email: 'demo.admin@eduverse.ai',
      school: 'EduVerse Demo Academy',
      grade: null
    }
  }[role];

  return {
    id: profileDetails.id,
    app_metadata: { provider: 'demo', providers: ['demo'] },
    user_metadata: {
      full_name: profileDetails.name,
      role: role,
      is_demo: true,
      grade: profileDetails.grade,
      school_name: profileDetails.school
    },
    aud: 'authenticated',
    role: 'authenticated',
    email: profileDetails.email,
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString()
  } as unknown as User;
};

export const createDemoSession = (demoUser: User): Session => {
  return {
    access_token: 'demo-access-token-eduverse',
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'demo-refresh-token-eduverse',
    user: demoUser
  } as Session;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoUser: boolean;
  demoRole: DemoRole | null;
  loginAsDemo: (role?: DemoRole) => void;
  exitDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  isDemoUser: false,
  demoRole: null,
  loginAsDemo: () => {},
  exitDemo: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [demoRole, setDemoRole] = useState<DemoRole | null>(() => {
    return (localStorage.getItem('eduverse_demo_role') as DemoRole) || null;
  });
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return !!localStorage.getItem('eduverse_demo_role');
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eduverse_demo_role') as DemoRole | null;
    return saved ? createDemoUser(saved) : null;
  });
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('eduverse_demo_role') as DemoRole | null;
    return saved ? createDemoSession(createDemoUser(saved)) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentSavedDemo = localStorage.getItem('eduverse_demo_role') as DemoRole | null;

        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setIsDemoUser(false);
          setDemoRole(null);
          localStorage.removeItem('eduverse_demo_role');
        } else if (currentSavedDemo) {
          const demoUser = createDemoUser(currentSavedDemo);
          setUser(demoUser);
          setSession(createDemoSession(demoUser));
          setIsDemoUser(true);
          setDemoRole(currentSavedDemo);
        } else {
          setSession(null);
          setUser(null);
          setIsDemoUser(false);
          setDemoRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentSavedDemo = localStorage.getItem('eduverse_demo_role') as DemoRole | null;
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsDemoUser(false);
        setDemoRole(null);
        localStorage.removeItem('eduverse_demo_role');
      } else if (currentSavedDemo) {
        const demoUser = createDemoUser(currentSavedDemo);
        setUser(demoUser);
        setSession(createDemoSession(demoUser));
        setIsDemoUser(true);
        setDemoRole(currentSavedDemo);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = (role: DemoRole = 'student') => {
    const demoUser = createDemoUser(role);
    const demoSession = createDemoSession(demoUser);
    localStorage.setItem('eduverse_demo_role', role);
    setUser(demoUser);
    setSession(demoSession);
    setIsDemoUser(true);
    setDemoRole(role);
    setLoading(false);
    navigate(`/dashboard/${role}`);
  };

  const exitDemo = async () => {
    localStorage.removeItem('eduverse_demo_role');
    setIsDemoUser(false);
    setDemoRole(null);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if not logged in to supabase
    }
    navigate('/');
  };

  const signOut = async () => {
    localStorage.removeItem('eduverse_demo_role');
    setIsDemoUser(false);
    setDemoRole(null);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if not logged in to supabase
    }
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemoUser, demoRole, loginAsDemo, exitDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
