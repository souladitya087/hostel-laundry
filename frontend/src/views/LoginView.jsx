import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  User, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Home, 
  Phone, 
  Mail, 
  Database,
  Building,
  GraduationCap,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [activeRole, setActiveRole] = useState('student'); // 'student' or 'admin'
  const [studentMode, setStudentMode] = useState('login'); // 'login' or 'register'
  
  // Admin form
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Student login form
  const [studentEmail, setStudentEmail] = useState('aditya.cs24@campus.edu');
  const [studentPassword, setStudentPassword] = useState('student123');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Student register form
  const [regForm, setRegForm] = useState({
    name: '',
    register_no: '',
    phone: '',
    email: '',
    password: '',
    room_no: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [demoUsers, setDemoUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDemoUsers();
  }, []);

  const loadDemoUsers = async () => {
    try {
      const data = await api.getDemoUsers();
      setDemoUsers(data);
    } catch (err) {
      console.warn('Could not load demo users:', err);
    }
  };

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login({
        role: 'admin',
        username: adminUsername,
        password: adminPassword
      });
      if (res && res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (emailToUse, passwordToUse, e) => {
    if (e) e.preventDefault();
    const email = (emailToUse || studentEmail).trim().toLowerCase();
    const pwd = passwordToUse !== undefined ? passwordToUse : studentPassword;

    if (!email) {
      setError('Please enter your college email.');
      return;
    }
    if (!pwd) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.login({
        role: 'student',
        email: email,
        password: pwd
      });
      if (res && res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Student authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.register_no || !regForm.room_no || !regForm.phone || !regForm.email || !regForm.password) {
      setError('Please fill in all registration fields, including your password.');
      return;
    }
    if (regForm.password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.registerStudent(regForm);
      if (res && res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setAdminUsername('admin');
    setAdminPassword('admin123');
    setError('');
  };

  const fillDemoStudent = (email, pwd = 'student123') => {
    setStudentEmail(email);
    setStudentPassword(pwd);
    setError('');
    handleStudentLogin(email, pwd);
  };

  return (
    <div className="login-page-container">
      {/* Background Decorative Blobs */}
      <div className="login-bg-glow glow-1" />
      <div className="login-bg-glow glow-2" />

      <div className="login-content-box">
        {/* Top Header */}
        <div className="login-branding">
          <div className="login-logo-bubble">
            <Sparkles size={28} className="sparkle-anim" />
          </div>
          <h1 className="login-title">Campus Laundry Portal</h1>
          <p className="login-subtitle">
            Hostel Wardrobe Care, Slot Scheduling & Automated Billing
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="login-role-tabs">
          <button 
            type="button"
            className={`role-tab-btn ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('student');
              setError('');
            }}
          >
            <GraduationCap size={18} />
            <span>Student Portal</span>
          </button>
          <button 
            type="button"
            className={`role-tab-btn ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveRole('admin');
              setError('');
            }}
          >
            <ShieldCheck size={18} />
            <span>Staff Administrator</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="error-alert login-error-anim">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STUDENT PORTAL TAB CONTENT */}
        {/* ============================================================== */}
        {activeRole === 'student' && (
          <div className="auth-card-panel glass-panel">
            <div className="auth-card-header">
              <div className="mode-toggle-pills">
                <button
                  type="button"
                  className={`pill-btn ${studentMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setStudentMode('login');
                    setError('');
                  }}
                >
                  <User size={14} />
                  <span>Student Sign In</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${studentMode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setStudentMode('register');
                    setError('');
                  }}
                >
                  <UserPlus size={14} />
                  <span>New Student Registration</span>
                </button>
              </div>
            </div>

            {studentMode === 'login' ? (
              /* Student Login Form with College Email & Password */
              <form onSubmit={(e) => handleStudentLogin(studentEmail, studentPassword, e)} className="auth-form">
                <div className="form-group">
                  <label className="form-label">College Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input 
                      type="email"
                      className="form-input form-input-lg"
                      placeholder="e.g. aditya.cs24@campus.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <span className="input-hint">Enter your registered college / campus email</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input 
                      type={showStudentPassword ? 'text' : 'password'}
                      className="form-input form-input-lg"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      tabIndex="-1"
                      aria-label="Toggle password visibility"
                    >
                      {showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="input-hint">Evaluation default password: <code>student123</code></span>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In with College Email'}</span>
                  <ArrowRight size={18} />
                </button>

                {/* Quick 1-Click Demo Profiles */}
                <div className="demo-accounts-section">
                  <span className="demo-heading">⚡ 1-Click Demo Student Accounts:</span>
                  <div className="demo-chips-grid">
                    {demoUsers?.sample_students?.map((std) => (
                      <button
                        key={std.student_id}
                        type="button"
                        className="demo-chip-btn"
                        onClick={() => fillDemoStudent(std.email, std.password || 'student123')}
                        title={`Sign in as ${std.name} (${std.email})`}
                      >
                        <strong>{std.name.split(' ')[0]} ({std.room_no})</strong>
                        <span>{std.email}</span>
                      </button>
                    )) || (
                      <>
                        <button type="button" className="demo-chip-btn" onClick={() => fillDemoStudent('aditya.cs24@campus.edu')}>
                          <strong>Aditya (BH-204)</strong>
                          <span>aditya.cs24@campus.edu</span>
                        </button>
                        <button type="button" className="demo-chip-btn" onClick={() => fillDemoStudent('priya.it24@campus.edu')}>
                          <strong>Priya (GH-102)</strong>
                          <span>priya.it24@campus.edu</span>
                        </button>
                        <button type="button" className="demo-chip-btn" onClick={() => fillDemoStudent('rohan.me23@campus.edu')}>
                          <strong>Rohan (BH-315)</strong>
                          <span>rohan.me23@campus.edu</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              /* Student Self-Registration Form with College Email & Password */
              <form onSubmit={handleStudentRegister} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rahul Sharma"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">College Email</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input 
                        type="email"
                        className="form-input"
                        placeholder="e.g. rahul.cs24@campus.edu"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input 
                        type={showRegPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Create password"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        required
                      />
                      <button 
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        tabIndex="-1"
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Register / Roll Number</label>
                    <div className="input-with-icon">
                      <GraduationCap size={16} className="input-icon" />
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g. 2024CS99"
                        value={regForm.register_no}
                        onChange={(e) => setRegForm({ ...regForm, register_no: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hostel Room No</label>
                    <div className="input-with-icon">
                      <Home size={16} className="input-icon" />
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g. BH-402"
                        value={regForm.room_no}
                        onChange={(e) => setRegForm({ ...regForm, room_no: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="e.g. +91 98765 00000"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                >
                  <span>{loading ? 'Creating Student Profile...' : 'Complete Registration & Sign In'}</span>
                  <CheckCircle2 size={18} />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STAFF ADMINISTRATOR TAB CONTENT */}
        {/* ============================================================== */}
        {activeRole === 'admin' && (
          <div className="auth-card-panel glass-panel">
            <div className="admin-banner-info">
              <ShieldCheck size={20} className="text-primary" />
              <div>
                <strong>Hostel Administrator Console</strong>
                <p>View and manage all laundry orders across students in all hostel blocks</p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="auth-form">
              <div className="form-group">
                <label className="form-label">Admin Username / Email</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="admin or admin@campus.edu"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                <span>{loading ? 'Verifying Admin...' : 'Sign In as Administrator'}</span>
                <ArrowRight size={18} />
              </button>

              {/* 1-Click Admin Demo Credentials */}
              <div className="demo-accounts-section">
                <div className="demo-admin-card" onClick={fillDemoAdmin}>
                  <div className="demo-admin-badge">
                    <KeyRound size={14} />
                    <span>Demo Credentials</span>
                  </div>
                  <div className="demo-admin-creds">
                    <span>Username: <code>admin</code></span>
                    <span>Password: <code>admin123</code></span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Footer Feature Badges */}
        <div className="login-features-row">
          <div className="feature-badge">
            <Database size={13} />
            <span>3NF Normalized Database</span>
          </div>
          <div className="feature-badge">
            <CheckCircle2 size={13} />
            <span>Capacity Stored Procedure</span>
          </div>
          <div className="feature-badge">
            <Building size={13} />
            <span>Hostel Multi-Role Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
