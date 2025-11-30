import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  UserCheck,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User,
  X,
  CheckCircle2
} from "lucide-react";

interface School {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  principal_name?: string;
  is_active: boolean;
  created_at: string;
}

interface Teacher {
  user_id: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
  teacher_profile?: {
    subject_specializations?: string[];
    school_id?: string;
  };
}

interface Student {
  user_id: string;
  class_grade: number;
  school_name?: string;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

const SchoolManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolTeachers, setSchoolTeachers] = useState<any[]>([]);
  const [schoolStudents, setSchoolStudents] = useState<Student[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // School form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    principal_name: "",
  });

  // Teacher assignment state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [isAssignTeacherDialogOpen, setIsAssignTeacherDialogOpen] = useState(false);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  // User creation state
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "teacher" as "student" | "teacher",
    class_grade: 12,
    phone: "",
    subject_specializations: [] as string[],
  });

  // Student assignment state
  const [isAssignStudentDialogOpen, setIsAssignStudentDialogOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSchools();
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolTeachers(selectedSchool.id);
      fetchSchoolStudents(selectedSchool.id);
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      const data = await api.admin.getSchools();
      setSchools(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch schools",
      });
    } finally {
      setLoadingSchools(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.admin.getAllUsers();
      setAllUsers(data || []);
      // Also keep teachers list for backward compatibility
      const teachersData = await api.admin.getAllTeachers();
      setTeachers(teachersData || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSchoolTeachers = async (schoolId: string) => {
    try {
      const data = await api.admin.getSchoolTeachers(schoolId);
      setSchoolTeachers(data || []);
    } catch (error: any) {
      console.error("Error fetching school teachers:", error);
      setSchoolTeachers([]);
    }
  };

  const fetchSchoolStudents = async (schoolId: string) => {
    try {
      setLoadingStudents(true);
      const data = await api.admin.getSchoolStudents(schoolId);
      setSchoolStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching school students:", error);
      setSchoolStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCreateSchool = async () => {
    try {
      await api.admin.createSchool(schoolForm);
      toast({
        title: "Success",
        description: "School created successfully",
      });
      setIsCreateDialogOpen(false);
      setSchoolForm({
        name: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        principal_name: "",
      });
      fetchSchools();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create school",
      });
    }
  };

  const handleUpdateSchool = async () => {
    if (!selectedSchool) return;

    try {
      await api.admin.updateSchool(selectedSchool.id, schoolForm);
      toast({
        title: "Success",
        description: "School updated successfully",
      });
      setIsEditDialogOpen(false);
      fetchSchools();
      setSelectedSchool(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update school",
      });
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (!confirm("Are you sure you want to delete this school? This will remove all teacher and student assignments.")) {
      return;
    }

    try {
      await api.admin.deleteSchool(schoolId);
      toast({
        title: "Success",
        description: "School deleted successfully",
      });
      fetchSchools();
      if (selectedSchool?.id === schoolId) {
        setSelectedSchool(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete school",
      });
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedSchool || !selectedTeacherId) return;

    try {
      // First, ensure user has teacher role
      const selectedUser = allUsers.find(u => u.user_id === selectedTeacherId);
      if (selectedUser && !selectedUser.roles?.includes("teacher")) {
        // Add teacher role
        await supabase
          .from("user_roles")
          .insert({ user_id: selectedTeacherId, role: "teacher" });
      }

      await api.admin.assignTeacherToSchool(selectedSchool.id, selectedTeacherId);
      toast({
        title: "Success",
        description: "User assigned to school as teacher successfully",
      });
      setIsAssignTeacherDialogOpen(false);
      setSelectedTeacherId("");
      setTeacherSearchQuery("");
      fetchSchoolTeachers(selectedSchool.id);
      fetchAllUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign teacher",
      });
    }
  };

  const handleCreateUser = async () => {
    // Validate required fields
    if (!userForm.full_name || !userForm.email || !userForm.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Validate student-specific fields
    if (userForm.role === "student" && !userForm.class_grade) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Class grade is required for students",
      });
      return;
    }

    // Validate password length
    if (userForm.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    try {
      const userData: any = {
        email: userForm.email,
        password: userForm.password,
        full_name: userForm.full_name,
        role: userForm.role,
      };

      if (userForm.role === "student") {
        // Ensure class_grade is always provided for students
        if (!userForm.class_grade) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Class grade is required for students",
          });
          return;
        }
        userData.class_grade = userForm.class_grade;
      } else {
        // Teacher-specific fields
        if (userForm.phone) userData.phone = userForm.phone;
        if (userForm.subject_specializations.length > 0) {
          userData.subject_specializations = userForm.subject_specializations;
        }
      }

      const newUser = await api.admin.createUser(userData);

      toast({
        title: "Success",
        description: `${userForm.role === "student" ? "Student" : "Teacher"} created successfully`,
      });

      setIsCreateUserDialogOpen(false);
      setUserForm({
        full_name: "",
        email: "",
        password: "",
        role: "teacher",
        class_grade: 12,
        phone: "",
        subject_specializations: [],
      });

      fetchAllUsers();

      // If school is selected, automatically assign to school
      if (selectedSchool && newUser.user_id) {
        if (userForm.role === "teacher") {
          await api.admin.assignTeacherToSchool(selectedSchool.id, newUser.user_id);
          fetchSchoolTeachers(selectedSchool.id);
        } else {
          await api.admin.assignStudentToSchool(selectedSchool.id, newUser.user_id);
          fetchSchoolStudents(selectedSchool.id);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user",
      });
    }
  };

  const handleRemoveTeacher = async (teacherId: string) => {
    if (!selectedSchool) return;

    if (!confirm("Are you sure you want to remove this teacher from the school?")) {
      return;
    }

    try {
      await api.admin.removeTeacherFromSchool(selectedSchool.id, teacherId);
      toast({
        title: "Success",
        description: "Teacher removed from school",
      });
      fetchSchoolTeachers(selectedSchool.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove teacher",
      });
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedSchool) return;

    // Check if student is already assigned to this school
    const isAlreadyAssigned = schoolStudents.some(s => s.user_id === studentId);
    if (isAlreadyAssigned) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Student is already assigned to this school",
      });
      return;
    }

    try {
      await api.admin.assignStudentToSchool(selectedSchool.id, studentId);
      toast({
        title: "Success",
        description: "Student assigned to school successfully",
      });
      setIsAssignStudentDialogOpen(false);
      setStudentSearchQuery("");
      setAvailableStudents([]);
      fetchSchoolStudents(selectedSchool.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign student",
      });
    }
  };

  const searchStudents = async (query: string) => {
    if (!query.trim()) {
      setAvailableStudents([]);
      return;
    }

    if (!selectedSchool) {
      setAvailableStudents([]);
      return;
    }

    try {
      // Fetch all student profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${query}%`)
        .limit(20);

      if (profiles) {
        // Get user roles to filter students
        const userIds = profiles.map(p => p.user_id);
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("user_id", userIds)
          .eq("role", "student");

        const studentIds = roles?.map(r => r.user_id) || [];
        const studentProfiles = profiles.filter(p => studentIds.includes(p.user_id));

        // Get already assigned student IDs for this school
        const assignedStudentIds = schoolStudents.map(s => s.user_id);

        // Filter out students already assigned to this school
        const availableStudentProfiles = studentProfiles.filter(
          p => !assignedStudentIds.includes(p.user_id)
        );

        setAvailableStudents(availableStudentProfiles.map(p => ({
          user_id: p.user_id,
          profile: p
        })));
      }
    } catch (error: any) {
      console.error("Error searching students:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search students",
      });
    }
  };

  const openEditDialog = (school: School) => {
    setSelectedSchool(school);
    setSchoolForm({
      name: school.name,
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      pincode: school.pincode || "",
      phone: school.phone || "",
      email: school.email || "",
      principal_name: school.principal_name || "",
    });
    setIsEditDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              School Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage schools, assign teachers, and handle students
            </p>
          </div>

          <Tabs defaultValue="schools" className="space-y-6">
            <TabsList>
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="teachers">Teacher Assignment</TabsTrigger>
              <TabsTrigger value="students">Student Management</TabsTrigger>
            </TabsList>

            {/* Schools Tab */}
            <TabsContent value="schools" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>All Schools</CardTitle>
                    <CardDescription>Manage school information and settings</CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create School
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New School</DialogTitle>
                        <DialogDescription>Add a new school to the system</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">School Name *</Label>
                            <Input
                              id="name"
                              value={schoolForm.name}
                              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                              placeholder="Enter school name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="principal_name">Principal Name</Label>
                            <Input
                              id="principal_name"
                              value={schoolForm.principal_name}
                              onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                              placeholder="Principal name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={schoolForm.address}
                            onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                            placeholder="School address"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={schoolForm.city}
                              onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={schoolForm.state}
                              onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })}
                              placeholder="State"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input
                              id="pincode"
                              value={schoolForm.pincode}
                              onChange={(e) => setSchoolForm({ ...schoolForm, pincode: e.target.value })}
                              placeholder="Pincode"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={schoolForm.phone}
                              onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                              placeholder="Phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={schoolForm.email}
                              onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                              placeholder="Email address"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateSchool} disabled={!schoolForm.name}>
                          Create School
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingSchools ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>School Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schools.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No schools found. Create your first school.
                            </TableCell>
                          </TableRow>
                        ) : (
                          schools.map((school) => (
                            <TableRow key={school.id}>
                              <TableCell>
                                <div>
                                  <p className="font-semibold">{school.name}</p>
                                  {school.principal_name && (
                                    <p className="text-sm text-muted-foreground">
                                      Principal: {school.principal_name}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {school.city && school.state
                                      ? `${school.city}, ${school.state}`
                                      : school.city || school.state || "-"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {school.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="h-3 w-3" />
                                      {school.phone}
                                    </div>
                                  )}
                                  {school.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="h-3 w-3" />
                                      {school.email}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={school.is_active ? "default" : "secondary"}>
                                  {school.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSchool(school);
                                      openEditDialog(school);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSchool(school.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teacher Assignment Tab */}
            <TabsContent value="teachers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Teachers to Schools</CardTitle>
                  <CardDescription>Select a school to manage teacher assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Select School</Label>
                      <Select
                        value={selectedSchool?.id || ""}
                        onValueChange={(value) => {
                          const school = schools.find((s) => s.id === value);
                          setSelectedSchool(school || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSchool && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Teachers at {selectedSchool.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {schoolTeachers.length} teacher(s) assigned
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog
                              open={isCreateUserDialogOpen}
                              onOpenChange={setIsCreateUserDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline">
                                  <User className="h-4 w-4 mr-2" />
                                  Create User
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Create New User</DialogTitle>
                                  <DialogDescription>
                                    Create a new student or teacher and optionally assign to {selectedSchool.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="user-full_name">Full Name *</Label>
                                      <Input
                                        id="user-full_name"
                                        value={userForm.full_name}
                                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                                        placeholder="Enter full name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="user-role">Role *</Label>
                                      <Select
                                        value={userForm.role}
                                        onValueChange={(v) => setUserForm({ ...userForm, role: v as "student" | "teacher" })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="teacher">Teacher</SelectItem>
                                          <SelectItem value="student">Student</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="user-email">Email *</Label>
                                      <Input
                                        id="user-email"
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        placeholder="Email address"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="user-password">Password *</Label>
                                      <Input
                                        id="user-password"
                                        type="password"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        placeholder="Password"
                                      />
                                    </div>
                                  </div>
                                  {userForm.role === "student" && (
                                    <div className="space-y-2">
                                      <Label htmlFor="user-class_grade">Class Grade *</Label>
                                      <Select
                                        value={userForm.class_grade.toString()}
                                        onValueChange={(v) => setUserForm({ ...userForm, class_grade: parseInt(v) })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select class grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                                            <SelectItem key={grade} value={grade.toString()}>
                                              Grade {grade}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <p className="text-xs text-muted-foreground">
                                        Required for student accounts
                                      </p>
                                    </div>
                                  )}
                                  {userForm.role === "teacher" && (
                                    <div className="space-y-2">
                                      <Label htmlFor="user-phone">Phone</Label>
                                      <Input
                                        id="user-phone"
                                        value={userForm.phone}
                                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                        placeholder="Phone number"
                                      />
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsCreateUserDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleCreateUser} 
                                    disabled={
                                      !userForm.full_name || 
                                      !userForm.email || 
                                      !userForm.password ||
                                      (userForm.role === "student" && !userForm.class_grade) ||
                                      userForm.password.length < 6
                                    }
                                  >
                                    Create {userForm.role === "student" ? "Student" : "Teacher"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isAssignTeacherDialogOpen}
                              onOpenChange={setIsAssignTeacherDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Assign Teacher
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Assign Teacher to {selectedSchool.name}</DialogTitle>
                                  <DialogDescription>
                                    Search and select any user to assign as teacher
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Search User</Label>
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        placeholder="Search by name..."
                                        value={teacherSearchQuery}
                                        onChange={(e) => {
                                          setTeacherSearchQuery(e.target.value);
                                        }}
                                        className="pl-9"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto space-y-2">
                                    {allUsers
                                      .filter(
                                        (u) =>
                                          !schoolTeachers.some((st) => st.teacher_id === u.user_id) &&
                                          (teacherSearchQuery.trim() === "" ||
                                            u.profile?.full_name?.toLowerCase().includes(teacherSearchQuery.toLowerCase()))
                                      )
                                      .slice(0, 20)
                                      .map((user) => (
                                        <div
                                          key={user.user_id}
                                          className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent cursor-pointer"
                                          onClick={() => {
                                            setSelectedTeacherId(user.user_id);
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage src={user.profile?.avatar_url} />
                                              <AvatarFallback>
                                                {getInitials(user.profile?.full_name || "U")}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="font-semibold text-sm">
                                                {user.profile?.full_name || "Unknown"}
                                              </p>
                                              <div className="flex gap-2">
                                                {user.roles?.map((role: string) => (
                                                  <Badge key={role} variant="outline" className="text-xs">
                                                    {role}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                          {selectedTeacherId === user.user_id && (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                          )}
                                        </div>
                                      ))}
                                    {allUsers.filter(
                                      (u) =>
                                        !schoolTeachers.some((st) => st.teacher_id === u.user_id) &&
                                        (teacherSearchQuery.trim() === "" ||
                                          u.profile?.full_name?.toLowerCase().includes(teacherSearchQuery.toLowerCase()))
                                    ).length === 0 && (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        {teacherSearchQuery ? "No users found" : "No users available"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsAssignTeacherDialogOpen(false);
                                      setSelectedTeacherId("");
                                      setTeacherSearchQuery("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button onClick={handleAssignTeacher} disabled={!selectedTeacherId}>
                                    Assign Teacher
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>

                        <div className="border rounded-lg">
                          {schoolTeachers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No teachers assigned yet. Assign your first teacher.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Teacher</TableHead>
                                  <TableHead>Specializations</TableHead>
                                  <TableHead>Assigned Date</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {schoolTeachers.map((assignment) => (
                                  <TableRow key={assignment.teacher_id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage
                                            src={assignment.profile?.avatar_url}
                                          />
                                          <AvatarFallback>
                                            {getInitials(
                                              assignment.profile?.full_name || "T"
                                            )}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-semibold">
                                            {assignment.profile?.full_name || "Unknown"}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {assignment.teacher_profile?.subject_specializations?.length
                                        ? assignment.teacher_profile.subject_specializations.join(", ")
                                        : "-"}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(assignment.assigned_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveTeacher(assignment.teacher_id)}
                                      >
                                        <X className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Student Management Tab */}
            <TabsContent value="students" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Students by School</CardTitle>
                  <CardDescription>View and assign students to schools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Select School</Label>
                      <Select
                        value={selectedSchool?.id || ""}
                        onValueChange={(value) => {
                          const school = schools.find((s) => s.id === value);
                          setSelectedSchool(school || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSchool && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Students at {selectedSchool.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {schoolStudents.length} student(s)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog
                              open={isCreateUserDialogOpen}
                              onOpenChange={setIsCreateUserDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline">
                                  <User className="h-4 w-4 mr-2" />
                                  Create Student
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Create New Student</DialogTitle>
                                  <DialogDescription>
                                    Create a new student account and optionally assign to {selectedSchool.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="student-create-full_name">Full Name *</Label>
                                      <Input
                                        id="student-create-full_name"
                                        value={userForm.full_name}
                                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                                        placeholder="Enter full name"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="student-create-class_grade">Class Grade *</Label>
                                      <Select
                                        value={userForm.class_grade.toString()}
                                        onValueChange={(v) => setUserForm({ ...userForm, class_grade: parseInt(v) })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select class grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                                            <SelectItem key={grade} value={grade.toString()}>
                                              Grade {grade}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="student-create-email">Email *</Label>
                                      <Input
                                        id="student-create-email"
                                        type="email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        placeholder="Email address"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="student-create-password">Password *</Label>
                                      <Input
                                        id="student-create-password"
                                        type="password"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        placeholder="Password (min 6 characters)"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsCreateUserDialogOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={async () => {
                                      // Create user with student role
                                      const studentData = {
                                        ...userForm,
                                        role: "student" as "student" | "teacher"
                                      };
                                      
                                      // Validate
                                      if (!studentData.full_name || !studentData.email || !studentData.password) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Please fill in all required fields",
                                        });
                                        return;
                                      }
                                      
                                      if (!studentData.class_grade) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Class grade is required for students",
                                        });
                                        return;
                                      }
                                      
                                      if (studentData.password.length < 6) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "Password must be at least 6 characters long",
                                        });
                                        return;
                                      }
                                      
                                      try {
                                        const userData: any = {
                                          email: studentData.email,
                                          password: studentData.password,
                                          full_name: studentData.full_name,
                                          role: "student",
                                          class_grade: studentData.class_grade,
                                        };
                                        
                                        const newUser = await api.admin.createUser(userData);
                                        
                                        toast({
                                          title: "Success",
                                          description: "Student created successfully",
                                        });
                                        
                                        setIsCreateUserDialogOpen(false);
                                        setUserForm({
                                          full_name: "",
                                          email: "",
                                          password: "",
                                          role: "teacher",
                                          class_grade: 12,
                                          phone: "",
                                          subject_specializations: [],
                                        });
                                        
                                        fetchAllUsers();
                                        
                                        // Automatically assign to school if selected
                                        if (selectedSchool && newUser.user_id) {
                                          await api.admin.assignStudentToSchool(selectedSchool.id, newUser.user_id);
                                          fetchSchoolStudents(selectedSchool.id);
                                        }
                                      } catch (error: any) {
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: error.message || "Failed to create student",
                                        });
                                      }
                                    }} 
                                    disabled={
                                      !userForm.full_name || 
                                      !userForm.email || 
                                      !userForm.password ||
                                      !userForm.class_grade ||
                                      userForm.password.length < 6
                                    }
                                  >
                                    Create Student
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isAssignStudentDialogOpen}
                              onOpenChange={(open) => {
                                setIsAssignStudentDialogOpen(open);
                                if (!open) {
                                  // Reset when dialog closes
                                  setStudentSearchQuery("");
                                  setAvailableStudents([]);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Assign Student
                                </Button>
                              </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Student to {selectedSchool.name}</DialogTitle>
                                <DialogDescription>
                                  Search and select a student to assign. Students already assigned to this school are not shown.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Search Student</Label>
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search by name..."
                                      value={studentSearchQuery}
                                      onChange={(e) => {
                                        setStudentSearchQuery(e.target.value);
                                        searchStudents(e.target.value);
                                      }}
                                      className="pl-9"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                  {availableStudents.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      {studentSearchQuery
                                        ? "No available students found. They may already be assigned to this school."
                                        : "Start typing to search for students"}
                                    </p>
                                  ) : (
                                    availableStudents.map((student) => (
                                      <div
                                        key={student.user_id}
                                        className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                        onClick={() => handleAssignStudent(student.user_id)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.profile?.avatar_url} />
                                            <AvatarFallback>
                                              {getInitials(student.profile?.full_name || "S")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-semibold text-sm">
                                              {student.profile?.full_name || "Unknown"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Student ID: {student.user_id.slice(0, 8)}...
                                            </p>
                                          </div>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsAssignStudentDialogOpen(false);
                                    setStudentSearchQuery("");
                                    setAvailableStudents([]);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          </div>
                        </div>

                        {loadingStudents ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <div className="border rounded-lg">
                            {schoolStudents.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                No students assigned yet. Assign your first student.
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>School</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {schoolStudents.map((student) => (
                                    <TableRow key={student.user_id}>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={student.profile?.avatar_url} />
                                            <AvatarFallback>
                                              {getInitials(student.profile?.full_name || "S")}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="font-semibold">
                                              {student.profile?.full_name || "Unknown"}
                                            </p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">Grade {student.class_grade}</Badge>
                                      </TableCell>
                                      <TableCell>{student.school_name || "-"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit School Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>Update school information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">School Name *</Label>
                <Input
                  id="edit-name"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-principal_name">Principal Name</Label>
                <Input
                  id="edit-principal_name"
                  value={schoolForm.principal_name}
                  onChange={(e) =>
                    setSchoolForm({ ...schoolForm, principal_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={schoolForm.city}
                  onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={schoolForm.state}
                  onChange={(e) => setSchoolForm({ ...schoolForm, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pincode">Pincode</Label>
                <Input
                  id="edit-pincode"
                  value={schoolForm.pincode}
                  onChange={(e) => setSchoolForm({ ...schoolForm, pincode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSchool} disabled={!schoolForm.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolManagement;

