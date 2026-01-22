import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">
            View and manage your ShelfMerch account details, business information, and
            preferences.
          </p>
        </header>

        <section className="rounded-lg border bg-card p-6 space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-sm text-muted-foreground">
                Your primary ShelfMerch login identity.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{user?.name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || 'Not provided'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Security & Access</h2>
              <p className="text-sm text-muted-foreground">
                Key information about how you access ShelfMerch.
              </p>
            </div>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Secure, email-based authentication.</li>
              <li>Access to dashboard, orders, stores, and analytics.</li>
              <li>Admin capabilities where applicable.</li>
            </ul>
          </div>
        </section>

       <section className='rounded-lg border bg-card p-6 space-y-4'>
         {/* Profile Settings */}
                  <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={user?.name} />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={user?.email} disabled />
                      </div>
                      <Button>Save Changes</Button>
                    </div>
                  </Card>
        
                  {/* Notifications */}
                  <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">Get notified when orders are placed</p>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Emails</p>
                          <p className="text-sm text-muted-foreground">Receive tips and updates from ShelfMerch</p>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </div>
                  </Card>
        
                  {/* Danger Zone */}
                  <Card className="p-6 border-destructive">
                    <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </Card>
       </section>

        <section className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Business Overview</h2>
            <p className="text-sm text-muted-foreground">
              High-level view of how you use ShelfMerch for your brand or business.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Use your profile together with the dashboard, stores, and analytics to build,
            launch, and scale your custom merchandise business. Configure your stores,
            connect sales channels, and manage your catalog from the rest of the
            dashboard navigation.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
