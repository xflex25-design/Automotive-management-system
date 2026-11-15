import { useState, type FormEvent } from "react";
import { useWorkspace } from "./workspace-context";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from "./fa-icons";
import { Button } from "@/components/ui/button";

export function Login() {
  const { login, register } = useWorkspace();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    if (isRegistering && !fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      let result;
      if (isRegistering) {
        result = await register(email, password, fullName);
      } else {
        result = await login(email, password);
      }

      if (!result.success) {
        setErrorMessage(
          result.error || (isRegistering ? "Registration failed." : "Authentication failed."),
        );
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Split Card Container matching reference layout */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-slate-100">
        {/* Left Side: Form & Branding */}
        <div className="p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Official Company Logo */}
            <div className="flex flex-col items-center text-center gap-2.5">
              <img
                src="/hirider-logo-official.jpeg"
                alt="Workshop Logo"
                className="h-14 w-auto object-contain rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Workshop Management
                </h1>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-label mt-0.5">
                  Vehicle Operations
                </p>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5 pt-2">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                {isRegistering ? "Create Account" : "Welcome Back!"}
              </h2>
              <p className="text-sm text-slate-500">
                {isRegistering
                  ? "Please fill in your details to get started"
                  : "Please login to your account"}
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {isRegistering && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <label
                    htmlFor="register-name"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-label"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="register-name"
                      type="text"
                      required={isRegistering}
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-label"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-label"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isRegistering && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    <span>Remember Me</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setErrorMessage(
                        "Please contact your workshop system administrator to reset credentials.",
                      );
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              {/* Action Button styled in brand blue */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {isRegistering ? "Creating account..." : "Logging in..."}
                    </>
                  ) : isRegistering ? (
                    "Create Account"
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Toggle */}
          <div className="pt-6 text-center text-xs font-medium text-slate-500">
            {isRegistering ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setErrorMessage(null);
                  }}
                  className="text-blue-600 text-sm font-medium hover:underline cursor-pointer"
                >
                  Login here
                </button>
              </span>
            ) : (
              <span>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErrorMessage(null);
                  }}
                  className="text-blue-600 text-sm font-medium hover:underline cursor-pointer"
                >
                  Create a Boss account
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Automotive Reference Illustration with blue background */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
            {/* Styled Illustration Card */}
            <div className="w-full bg-gradient-to-b from-sky-100 to-blue-100 rounded-2xl p-6 shadow-xl border border-white/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent pointer-events-none" />

              {/* Automotive illustration graphic */}
              <div className="relative py-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-48 h-28 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg relative flex items-center justify-center transform -rotate-1 group-hover:rotate-0 transition duration-300">
                  <div className="absolute top-2 w-28 h-12 bg-sky-100/90 rounded-lg border border-blue-300 shadow-inner" />
                  <div className="absolute bottom-2 left-4 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-300 shadow flex items-center justify-center text-white text-xs font-medium">
                    4x4
                  </div>
                  <div className="absolute bottom-2 right-4 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-300 shadow flex items-center justify-center text-white text-xs font-medium">
                    4x4
                  </div>
                  <div className="absolute bottom-4 bg-white px-2 py-0.5 rounded text-xs font-medium tabular-nums tracking-tight text-slate-900 shadow">
                    CAR 2255
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Precision Garage & Workshop Control
              </h3>
              <p className="text-sm text-blue-100 leading-relaxed">
                Streamline vehicle registration, quotations, inventory cards, job cards, parts
                requisitions, and departmental dispatch with real-time tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
