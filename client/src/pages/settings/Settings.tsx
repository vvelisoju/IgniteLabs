import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/simplified-auth";
import { Helmet } from "react-helmet-async";
import { Loader2, Save, Upload, Image as ImageIcon, Mail, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface OrganizationSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  gstin?: string;
  logo?: string;
}

function LogoUpload({ currentLogo, onLogoUpdated }: { currentLogo?: string, onLogoUpdated: () => void }) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('logo', file);
      
      // Upload the logo
      const response = await fetch('/api/settings/organization/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Call the onLogoUpdated callback to refresh settings
      onLogoUpdated();
      
      toast({
        title: "Logo Uploaded",
        description: "Organization logo has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-4 p-4 border-2 border-dashed border-neutral-200 rounded-lg">
      {currentLogo ? (
        <div className="relative w-36 h-36 flex items-center justify-center">
          <img 
            src={currentLogo} 
            alt="Organization Logo" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-36 h-36 bg-neutral-50 rounded-lg flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-neutral-300" />
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleUploadClick}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {currentLogo ? "Change Logo" : "Upload Logo"}
      </Button>
      
      {currentLogo && (
        <p className="text-sm text-neutral-500">
          Upload a new image to replace the current logo
        </p>
      )}
    </div>
  );
}

// Define interface for email notification settings
interface EmailNotificationSettings {
  emailNotificationsEnabled: boolean;
  studentRegistration: boolean;
  paymentReceipt: boolean;
  paymentReminder: boolean;
  batchStartReminder: boolean;
  leadNotification: boolean;
}

// Define interface for email credentials
interface EmailCredentials {
  hasMailgunAPIKey: boolean;
  hasMailgunDomain: boolean;
  hasMailgunFrom: boolean;
  mailgunDomain: string;
  mailgunFrom: string;
}

// Email Notifications Settings Component
function EmailSettings() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showMailgunForm, setShowMailgunForm] = useState(false);
  const [isUpdatingMailgunCredentials, setIsUpdatingMailgunCredentials] = useState(false);
  const [mailgunCredentials, setMailgunCredentials] = useState({
    apiKey: "",
    domain: "",
    fromEmail: ""
  });
  
  // Fetch email notification settings
  const { isLoading: isLoadingSettings, data: emailSettings } = useQuery<EmailNotificationSettings>({
    queryKey: ["/api/settings/notifications/email"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/notifications/email");
      return response.json();
    },
  });
  
  // Fetch email credentials
  const { isLoading: isLoadingCredentials, data: emailCredentials } = useQuery<EmailCredentials>({
    queryKey: ["/api/settings/notifications/email/credentials"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/notifications/email/credentials");
      return response.json();
    },
    enabled: !!emailSettings // Only load credentials after settings are loaded
  });

  // Update form values when credentials are loaded
  React.useEffect(() => {
    if (emailCredentials) {
      if (emailCredentials.mailgunDomain) {
        setMailgunCredentials(prev => ({
          ...prev,
          domain: emailCredentials.mailgunDomain
        }));
      }
      if (emailCredentials.mailgunFrom) {
        setMailgunCredentials(prev => ({
          ...prev,
          fromEmail: emailCredentials.mailgunFrom
        }));
      }
    }
  }, [emailCredentials]);
  
  // Update email notification settings
  const updateEmailSettingsMutation = useMutation({
    mutationFn: async (data: Partial<EmailNotificationSettings>) => {
      const response = await apiRequest(
        "PUT",
        "/api/settings/notifications/email",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/notifications/email"] });
      toast({
        title: "Settings Updated",
        description: "Email notification settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email notification settings. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle toggling the main email notifications switch
  const handleToggleEmailNotifications = (checked: boolean) => {
    updateEmailSettingsMutation.mutate({
      emailNotificationsEnabled: checked,
    });
  };
  
  // Handle toggling individual notification types
  const handleToggleNotificationType = (type: keyof Omit<EmailNotificationSettings, 'emailNotificationsEnabled'>, checked: boolean) => {
    updateEmailSettingsMutation.mutate({
      [type]: checked,
    });
  };
  
  // Update Mailgun credentials
  const updateMailgunCredentialsMutation = useMutation({
    mutationFn: async (credentials: { apiKey: string; domain: string; fromEmail: string }) => {
      const response = await apiRequest(
        "PUT",
        "/api/settings/notifications/email/credentials",
        credentials
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/notifications/email/credentials"] });
      toast({
        title: "Credentials Updated",
        description: "Mailgun credentials have been updated successfully.",
      });
      // Hide the form after successful update
      setShowMailgunForm(false);
      setIsUpdatingMailgunCredentials(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update Mailgun credentials. Please try again.",
        variant: "destructive",
      });
      setIsUpdatingMailgunCredentials(false);
    },
  });

  // Handle form submission for updating Mailgun credentials
  const handleUpdateMailgunCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mailgunCredentials.apiKey || !mailgunCredentials.domain || !mailgunCredentials.fromEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all Mailgun credential fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUpdatingMailgunCredentials(true);
    updateMailgunCredentialsMutation.mutate(mailgunCredentials);
  };

  // Send test email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the test message.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSendingTest(true);
      const response = await apiRequest("POST", "/api/settings/notifications/email/test", { email: testEmail });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Test Email Sent",
          description: `A test email has been sent to ${testEmail}`,
        });
      } else {
        throw new Error(data.error || "Failed to send test email");
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email. Please check the email configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  
  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium">Email Notifications</h3>
            <p className="text-neutral-500">Control which email notifications are sent from the system</p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="emailEnabled"
              checked={emailSettings?.emailNotificationsEnabled || false}
              onCheckedChange={handleToggleEmailNotifications}
              disabled={updateEmailSettingsMutation.isPending}
            />
            <Label htmlFor="emailEnabled" className="font-medium">
              {emailSettings?.emailNotificationsEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Student Notifications</CardTitle>
                <CardDescription>Emails sent to students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Registration Confirmation</p>
                    <p className="text-sm text-neutral-500">Send welcome email when a student registers</p>
                  </div>
                  <Switch 
                    checked={emailSettings?.studentRegistration || false}
                    onCheckedChange={(checked) => handleToggleNotificationType('studentRegistration', checked)}
                    disabled={!emailSettings?.emailNotificationsEnabled || updateEmailSettingsMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Receipt</p>
                    <p className="text-sm text-neutral-500">Send receipt when a payment is recorded</p>
                  </div>
                  <Switch 
                    checked={emailSettings?.paymentReceipt || false}
                    onCheckedChange={(checked) => handleToggleNotificationType('paymentReceipt', checked)}
                    disabled={!emailSettings?.emailNotificationsEnabled || updateEmailSettingsMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment Reminder</p>
                    <p className="text-sm text-neutral-500">Send reminders for upcoming payments</p>
                  </div>
                  <Switch 
                    checked={emailSettings?.paymentReminder || false}
                    onCheckedChange={(checked) => handleToggleNotificationType('paymentReminder', checked)}
                    disabled={!emailSettings?.emailNotificationsEnabled || updateEmailSettingsMutation.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Batch Start Reminder</p>
                    <p className="text-sm text-neutral-500">Notify students before batch starts</p>
                  </div>
                  <Switch 
                    checked={emailSettings?.batchStartReminder || false}
                    onCheckedChange={(checked) => handleToggleNotificationType('batchStartReminder', checked)}
                    disabled={!emailSettings?.emailNotificationsEnabled || updateEmailSettingsMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Admin Notifications</CardTitle>
                <CardDescription>Emails sent to administrators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lead Notification</p>
                    <p className="text-sm text-neutral-500">Notify admin when a new lead is created</p>
                  </div>
                  <Switch 
                    checked={emailSettings?.leadNotification || false}
                    onCheckedChange={(checked) => handleToggleNotificationType('leadNotification', checked)}
                    disabled={!emailSettings?.emailNotificationsEnabled || updateEmailSettingsMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Email Configuration Testing */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
        <h3 className="text-lg font-medium mb-2">Email Configuration</h3>
        <p className="text-neutral-500 mb-4">Test your email configuration to ensure notifications are working</p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Mailgun Credentials Status</h4>
              {isLoadingCredentials ? (
                <div className="flex items-center text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading credentials...
                </div>
              ) : (
                <div className="space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${emailCredentials?.hasMailgunAPIKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>API Key: {emailCredentials?.hasMailgunAPIKey ? 'Configured' : 'Missing'}</span>
                    </li>
                    <li className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${emailCredentials?.hasMailgunDomain ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>Domain: {emailCredentials?.hasMailgunDomain ? emailCredentials.mailgunDomain : 'Missing'}</span>
                    </li>
                    <li className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${emailCredentials?.hasMailgunFrom ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>From Email: {emailCredentials?.hasMailgunFrom ? emailCredentials.mailgunFrom : 'Missing'}</span>
                    </li>
                  </ul>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowMailgunForm(!showMailgunForm)}
                  >
                    {showMailgunForm ? "Hide Credential Form" : "Update Mailgun Credentials"}
                  </Button>
                  
                  {showMailgunForm && (
                    <form onSubmit={handleUpdateMailgunCredentials} className="space-y-4 mt-4 border rounded-md p-4 bg-neutral-50">
                      <div>
                        <Label htmlFor="mailgunApiKey" className="mb-1 block">Mailgun API Key</Label>
                        <Input
                          id="mailgunApiKey"
                          type="password"
                          placeholder="Enter Mailgun API Key"
                          value={mailgunCredentials.apiKey}
                          onChange={(e) => setMailgunCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mailgunDomain" className="mb-1 block">Mailgun Domain</Label>
                        <Input
                          id="mailgunDomain"
                          type="text"
                          placeholder="Enter Mailgun Domain"
                          value={mailgunCredentials.domain}
                          onChange={(e) => setMailgunCredentials(prev => ({ ...prev, domain: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mailgunFrom" className="mb-1 block">From Email</Label>
                        <Input
                          id="mailgunFrom"
                          type="text"
                          placeholder="Your Name <youremail@domain.com>"
                          value={mailgunCredentials.fromEmail}
                          onChange={(e) => setMailgunCredentials(prev => ({ ...prev, fromEmail: e.target.value }))}
                          required
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                          Format: "Your Name &lt;email@domain.com&gt;" or just "email@domain.com"
                        </p>
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isUpdatingMailgunCredentials}
                        className="w-full"
                      >
                        {isUpdatingMailgunCredentials ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          "Save Credentials"
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Send Test Email</h4>
              <form onSubmit={handleSendTestEmail} className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor="testEmail" className="mb-2 block">Recipient Email</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="Enter test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSendingTest || !emailSettings?.emailNotificationsEnabled}
                  className="flex items-center gap-2"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Send Test
                </Button>
              </form>
              {!emailSettings?.emailNotificationsEnabled && (
                <p className="text-sm text-amber-600 mt-2">
                  Enable email notifications to send test emails.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("organization");
  const [settings, setSettings] = useState<OrganizationSettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    gstin: "",
  });

  const { isLoading } = useQuery({
    queryKey: ["/api/settings/organization"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/organization");
      const data = await response.json();
      setSettings(data);
      return data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      const response = await apiRequest(
        "PUT",
        "/api/settings/organization",
        formData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/organization"] });
      toast({
        title: "Settings Updated",
        description: "Your organization settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettingsMutation.mutate({
      organization_name: settings.name,
      organization_address: settings.address,
      organization_phone: settings.phone,
      organization_email: settings.email,
      organization_website: settings.website || "",
      organization_gstin: settings.gstin || "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings | Ignite Labs</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Settings</h1>
          <p className="text-neutral-500">Manage your organization details and system preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-2 mb-6">
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="notifications">Email Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organization" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload Section */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Organization Logo</Label>
                  <LogoUpload 
                    currentLogo={settings.logo} 
                    onLogoUpdated={() => {
                      // Refresh organization settings after logo upload
                      queryClient.invalidateQueries({ queryKey: ["/api/settings/organization"] });
                    }}
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={settings.name}
                    onChange={handleChange}
                    placeholder="Enter organization name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Organization Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={settings.email}
                    onChange={handleChange}
                    placeholder="Enter organization email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                    placeholder="Enter organization phone"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    name="website"
                    value={settings.website || ""}
                    onChange={handleChange}
                    placeholder="Enter organization website"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    placeholder="Enter organization address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (Optional)</Label>
                  <Input
                    id="gstin"
                    name="gstin"
                    value={settings.gstin || ""}
                    onChange={handleChange}
                    placeholder="Enter GSTIN number"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="notifications">
            <EmailSettings />
          </TabsContent>
        </Tabs>

        {/* Diagnostic Information for Admin Users */}
        {user?.role === 'admin' && (
          <div className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold text-neutral-800">Tenant Information</h2>
            <TenantDiagnostic />
          </div>
        )}
      </div>
    </>
  );
}

function TenantDiagnostic() {
  const { isLoading, data, error } = useQuery({
    queryKey: ["/api/diagnostic/tenant-info"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/diagnostic/tenant-info");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-neutral-500">Loading tenant information...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading tenant information</div>;
  }

  return (
    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-neutral-700">Tenant Information</h3>
          <p className="text-sm text-neutral-500">Current Tenant: {data?.current_tenant?.name || 'Unknown'}</p>
          <p className="text-sm text-neutral-500">Total Tenants: {data?.tenant_count || 0}</p>
        </div>
        <div>
          <h3 className="font-medium text-neutral-700">Settings Information</h3>
          <p className="text-sm text-neutral-500">Total Settings: {data?.settings_count || 0}</p>
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="font-medium text-neutral-700">Tenant Settings</h3>
        <div className="mt-2 max-h-40 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left p-2">Key</th>
                <th className="text-left p-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {data?.tenant_settings && data.tenant_settings.length > 0 ? (
                data.tenant_settings.map((setting: {key: string, value: string}, index: number) => (
                  <tr key={index} className="border-b border-neutral-100">
                    <td className="p-2">{setting.key}</td>
                    <td className="p-2">{setting.value}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-2 text-center text-neutral-500">No settings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}