import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PasswordRule = {
  label: string;
  test: (password: string) => boolean;
};

type ForgotPasswordStep = 'email' | 'otp' | 'reset';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Forgot password states
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep | null>(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetPasswordErrors, setResetPasswordErrors] = useState<string[]>([]);
  const [resetConfirmPasswordError, setResetConfirmPasswordError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Password validation rules
  const passwordRules: PasswordRule[] = [
    {
      label: '8 to 30 characters',
      test: (pwd) => pwd.length >= 8 && pwd.length <= 30,
    },
    {
      label: 'At least 1 uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      label: 'At least 1 lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      label: 'At least 1 number',
      test: (pwd) => /\d/.test(pwd),
    },
    {
      label: 'At least 1 special character (! @ # $ % ^ & * ( ) _ + -)',
      test: (pwd) => /[!@#$%^&*()_+\-]/.test(pwd),
    },
  ];

  // Validate name (alphabets and spaces only)
  const validateName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Name is required';
    }
    if (!/^[A-Za-z\s]+$/.test(trimmed)) {
      return 'Name can contain only alphabets and spaces';
    }
    return '';
  };

  // Validate email
  const validateEmail = (email: string): string => {
    const trimmed = email.trim();
    if (!trimmed) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Validate password and return failed rules
  const validatePassword = (password: string): string[] => {
    const failed: string[] = [];
    passwordRules.forEach((rule) => {
      if (!rule.test(password)) {
        failed.push(rule.label);
      }
    });
    return failed;
  };

  // Handle name input (prevent invalid characters)
  const handleNameChange = (value: string) => {
    // Allow only alphabets and spaces
    const filtered = value.replace(/[^A-Za-z\s]/g, '');
    setSignupName(filtered);
    // Trim extra spaces on blur
    if (filtered !== value) {
      const trimmed = filtered.replace(/\s+/g, ' ').trim();
      setSignupName(trimmed);
      setNameError(validateName(trimmed));
    } else {
      setNameError('');
    }
  };

  // Handle name blur
  const handleNameBlur = () => {
    const trimmed = signupName.trim().replace(/\s+/g, ' ');
    setSignupName(trimmed);
    setNameError(validateName(trimmed));
  };

  // Handle email change
  const handleEmailChange = (value: string, isSignup: boolean) => {
    if (isSignup) {
      setSignupEmail(value);
    } else {
      setLoginEmail(value);
    }
    setEmailError('');
  };

  // Handle email blur
  const handleEmailBlur = (email: string, isSignup: boolean) => {
    const error = validateEmail(email);
    setEmailError(error);
  };

  // Handle password change with live validation
  const handlePasswordChange = (value: string, isSignup: boolean) => {
    if (isSignup) {
      setSignupPassword(value);
      const errors = validatePassword(value);
      setPasswordErrors(errors);
      // Clear confirm password error if passwords match
      if (confirmPassword && value === confirmPassword) {
        setConfirmPasswordError('');
      }
    } else {
      setLoginPassword(value);
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (value: string, isSignup: boolean) => {
    if (isSignup) {
      setConfirmPassword(value);
      if (value && signupPassword && value !== signupPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setResetConfirmPassword(value);
      if (value && resetPassword && value !== resetPassword) {
        setResetConfirmPasswordError('Passwords do not match');
      } else {
        setResetConfirmPasswordError('');
      }
    }
  };

  // Check for verification status in URL params
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      toast.success('Email verified successfully! You can now log in.');
    } else if (error) {
      if (error === 'invalid_token') {
        toast.error('Invalid verification token');
      } else if (error === 'invalid_or_expired_token') {
        toast.error('Verification token is invalid or has expired. Please request a new one.');
      } else if (error === 'verification_failed') {
        toast.error('Email verification failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const emailError = validateEmail(loginEmail);
    if (emailError) {
      setEmailError(emailError);
      setIsLoading(false);
      return;
    }

    try {
      await login(loginEmail.trim(), loginPassword);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error?.response?.data?.requiresVerification) {
        toast.error('Please verify your email address before logging in. Check your inbox for the verification email.');
      } else {
        toast.error(error?.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields
    const nameErr = validateName(signupName);
    const emailErr = validateEmail(signupEmail);
    const pwdErrors = validatePassword(signupPassword);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordErrors(pwdErrors);

    if (signupPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    }

    if (nameErr || emailErr || pwdErrors.length > 0 || signupPassword !== confirmPassword) {
      setIsLoading(false);
      return;
    }

    try {
      await signup(signupEmail.trim(), signupPassword, signupName.trim());
      toast.success('Account created! Please check your email to verify your account.');
    } catch (error: any) {
      // Handle account already exists
      if (error?.response?.data?.message?.toLowerCase().includes('already exists') ||
          error?.response?.data?.message?.toLowerCase().includes('user already exists')) {
        toast.error('Account already exists. Please login.');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password handlers
  const handleForgotPasswordClick = () => {
    setForgotPasswordStep('email');
    setForgotEmail('');
    setForgotOtp(['', '', '', '', '', '']);
    setResetPassword('');
    setResetConfirmPassword('');
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const emailErr = validateEmail(forgotEmail);
    if (emailErr) {
      setEmailError(emailErr);
      setIsLoading(false);
      return;
    }

    try {
      await authApi.forgotPassword(forgotEmail.trim());
      toast.success("We've sent a verification code to your email.");
      setForgotPasswordStep('otp');
    } catch (error: any) {
      // Backend doesn't reveal if email exists, but we can show friendly message
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('No account found with this email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return; // Only allow single digit

    const newOtp = [...forgotOtp];
    newOtp[index] = value;
    setForgotOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setForgotOtp(digits);
      // Focus last input
      const lastInput = document.getElementById('otp-5');
      lastInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = forgotOtp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyResetOTP(forgotEmail.trim(), otpString);
      setForgotPasswordStep('reset');
      toast.success('Code verified successfully');
    } catch (error: any) {
      if (error?.response?.data?.message?.toLowerCase().includes('expired')) {
        toast.error('Code expired. Please request a new one.');
      } else {
        toast.error('Invalid or expired verification code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordChange = (value: string) => {
    setResetPassword(value);
    const errors = validatePassword(value);
    setResetPasswordErrors(errors);
    // Clear confirm password error if passwords match
    if (resetConfirmPassword && value === resetConfirmPassword) {
      setResetConfirmPasswordError('');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const pwdErrors = validatePassword(resetPassword);
    setResetPasswordErrors(pwdErrors);

    if (resetPassword !== resetConfirmPassword) {
      setResetConfirmPasswordError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (pwdErrors.length > 0) {
      setIsLoading(false);
      return;
    }

    const otpString = forgotOtp.join('');
    try {
      await authApi.resetPassword(forgotEmail.trim(), otpString, resetPassword);
      toast.success('Password updated successfully. Please login.');
      // Reset all states and go back to login
      setForgotPasswordStep(null);
      setForgotEmail('');
      setForgotOtp(['', '', '', '', '', '']);
      setResetPassword('');
      setResetConfirmPassword('');
      // Switch to login tab
      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
      loginTab?.click();
    } catch (error: any) {
      if (error?.response?.data?.message?.toLowerCase().includes('expired')) {
        toast.error('Code expired. Please request a new one.');
        setForgotPasswordStep('email');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render password rules checklist
  const renderPasswordRules = (password: string, errors: string[]) => {
    return (
      <div className="mt-2 space-y-1">
        {passwordRules.map((rule, index) => {
          const passed = rule.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              {passed ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              <span className={passed ? 'text-green-700' : 'text-red-700'}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // If forgot password flow is active, show that instead
  if (forgotPasswordStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Shelf<span className="text-primary">Merch</span>
            </h1>
            <p className="text-muted-foreground">
              {forgotPasswordStep === 'email' && 'Reset your password'}
              {forgotPasswordStep === 'otp' && 'Enter verification code'}
              {forgotPasswordStep === 'reset' && 'Create new password'}
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-card p-6">
            {forgotPasswordStep === 'email' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setEmailError('');
                    }}
                    onBlur={() => handleEmailBlur(forgotEmail, false)}
                    placeholder="you@example.com"
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForgotPasswordStep(null)}
                >
                  Back to Login
                </Button>
              </form>
            )}

            {forgotPasswordStep === 'otp' && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    We've sent a 6-digit code to <strong>{forgotEmail}</strong>
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  {forgotOtp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onPaste={handleOtpPaste}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold"
                      required
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || forgotOtp.join('').length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setForgotPasswordStep('email');
                    setForgotOtp(['', '', '', '', '', '']);
                  }}
                >
                  Resend Code
                </Button>
              </div>
            )}

            {forgotPasswordStep === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">New Password</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => handleResetPasswordChange(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {resetPassword && renderPasswordRules(resetPassword, resetPasswordErrors)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value, false)}
                    placeholder="••••••••"
                    required
                  />
                  {resetConfirmPasswordError && (
                    <p className="text-sm text-red-600">{resetConfirmPasswordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Shelf<span className="text-primary">Merch</span>
          </h1>
          <p className="text-muted-foreground">Start your print-on-demand business</p>
        </div>

        <div className="bg-card rounded-lg shadow-card p-6">
          {/* Verification status messages */}
          {searchParams.get('verified') === 'true' && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email verified successfully! You can now log in.
              </AlertDescription>
            </Alert>
          )}
          {searchParams.get('error') && searchParams.get('error') !== 'invalid_credentials' && (
            <Alert className="mb-4 border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {searchParams.get('error') === 'invalid_or_expired_token'
                  ? 'Verification token is invalid or has expired. Please request a new one.'
                  : 'Email verification failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => handleEmailChange(e.target.value, false)}
                    onBlur={() => handleEmailBlur(loginEmail, false)}
                    placeholder="you@example.com"
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Log in'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="John Doe"
                    required
                  />
                  {nameError && (
                    <p className="text-sm text-red-600">{nameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => handleEmailChange(e.target.value, true)}
                    onBlur={() => handleEmailBlur(signupEmail, true)}
                    placeholder="you@example.com"
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => handlePasswordChange(e.target.value, true)}
                    placeholder="••••••••"
                    required
                  />
                  {signupPassword && renderPasswordRules(signupPassword, passwordErrors)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value, true)}
                    placeholder="••••••••"
                    required
                  />
                  {confirmPasswordError && (
                    <p className="text-sm text-red-600">{confirmPasswordError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign up for Free'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
