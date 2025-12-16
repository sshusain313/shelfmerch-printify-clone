import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { storeApi } from '@/lib/api';
import { Store } from '@/types';
import { getTheme } from '@/lib/themes';

const StoreAuthPage = () => {
    const { subdomain } = useParams<{ subdomain: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login, register, isAuthenticated } = useStoreAuth();

    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [isLoadingAuth, setIsLoadingAuth] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const redirectPath = searchParams.get('redirect') || 'checkout';

    useEffect(() => {
        const loadStore = async () => {
            if (!subdomain) return;
            try {
                const response = await storeApi.getBySubdomain(subdomain);
                if (response.success && response.data) {
                    setStore(response.data);
                }
            } catch (error) {
                console.error('Failed to load store:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStore();
    }, [subdomain]);

    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated && store) {
            // Forward any state (like cart) that was passed to the auth page
            navigate(`/store/${store.subdomain}/${redirectPath}`, { state: location.state });
        }
    }, [isAuthenticated, store, navigate, redirectPath, location.state]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subdomain) return;

        setIsLoadingAuth(true);
        const success = await login(subdomain, email, password);
        setIsLoadingAuth(false);

        // Navigation handled by useEffect
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subdomain) return;

        setIsLoadingAuth(true);
        const success = await register(subdomain, name, email, password);
        setIsLoadingAuth(false);

        // Navigation handled by useEffect
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!store) {
        return <div className="min-h-screen flex items-center justify-center">Store not found</div>;
    }

    const theme = getTheme(store.theme);
    const primaryColor = theme.colors.primary;

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>{store.storeName}</h1>
                    <p className="text-muted-foreground">Sign in to continue to checkout</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</CardTitle>
                        <CardDescription>
                            {activeTab === 'login'
                                ? 'Enter your credentials to access your account'
                                : 'Enter your details to create a new account'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="register">Register</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="login-password">Password</Label>
                                            <Button variant="link" className="px-0 font-normal h-auto text-xs" type="button">
                                                Forgot password?
                                            </Button>
                                        </div>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoadingAuth}
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {isLoadingAuth ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="register">
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-name">Full Name</Label>
                                        <Input
                                            id="reg-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-email">Email</Label>
                                        <Input
                                            id="reg-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-password">Password</Label>
                                        <Input
                                            id="reg-password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoadingAuth}
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {isLoadingAuth ? 'Creating account...' : 'Create Account'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="text-center text-sm text-muted-foreground">
                    <Button variant="link" onClick={() => navigate(`/store/${subdomain}`)}>
                        Return to Store
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StoreAuthPage;
