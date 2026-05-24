'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  updatePassword,
  type AuthUser,
} from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';

/* ─── Amplify Configuration ─── */
// Replace these values with your actual AWS Amplify project outputs.
// In production, use `amplify_outputs.json` (Amplify Gen 2) or `aws-exports.js` (Gen 1).
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '',
      signUpVerificationMethod: 'code',
    },
  },
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET ?? '',
      region: process.env.NEXT_PUBLIC_AWS_REGION ?? 'us-east-1',
    },
  },
});

/* ─── Global Styles ─── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

  :root {
    --bg-primary:#0a0f1e;
    --bg-secondary:#0f1629;
    --bg-card:#131d35;
    --bg-glass:rgba(19,29,53,0.7);
    --border:#1e2d4f;
    --border-glow:rgba(56,189,248,0.25);
    --accent:#38bdf8;
    --accent-dim:rgba(56,189,248,0.12);
    --accent2:#818cf8;
    --accent2-dim:rgba(129,140,248,0.12);
    --green:#34d399;
    --green-dim:rgba(52,211,153,0.12);
    --amber:#fbbf24;
    --amber-dim:rgba(251,191,36,0.12);
    --red:#f87171;
    --red-dim:rgba(248,113,113,0.12);
    --text:#e2e8f0;
    --text-muted:#64748b;
    --text-dim:#94a3b8;
    --sidebar-w:260px;
    --radius:12px;
    --radius-sm:8px;
    --font:'DM Sans',system-ui,sans-serif;
    --font-mono:'Space Mono',monospace;
  }
  [data-theme="light"] {
    --bg-primary:#f0f4ff;
    --bg-secondary:#e8eeff;
    --bg-card:#ffffff;
    --bg-glass:rgba(255,255,255,0.85);
    --border:#c7d5f0;
    --border-glow:rgba(56,130,248,0.3);
    --accent:#2563eb;
    --accent-dim:rgba(37,99,235,0.08);
    --accent2:#7c3aed;
    --accent2-dim:rgba(124,58,237,0.08);
    --green:#059669;
    --green-dim:rgba(5,150,105,0.08);
    --amber:#d97706;
    --amber-dim:rgba(217,119,6,0.08);
    --red:#dc2626;
    --red-dim:rgba(220,38,38,0.08);
    --text:#1e293b;
    --text-muted:#94a3b8;
    --text-dim:#64748b;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{height:100%;font-family:var(--font);background:var(--bg-primary);color:var(--text);transition:background .3s,color .3s;}
  #root{height:100%;}
  input,textarea,select{font-family:var(--font);}
  button{cursor:pointer;font-family:var(--font);}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;}

  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scanLine{from{top:0}to{top:100%}}
  @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes glowPulse{0%,100%{box-shadow:0 0 10px var(--border-glow)}50%{box-shadow:0 0 25px var(--border-glow),0 0 50px rgba(56,189,248,0.1)}}

  .animate-fade{animation:fadeIn .4s ease forwards;}
  .animate-slide{animation:slideIn .35s ease forwards;}
  .skeleton{background:linear-gradient(90deg,var(--bg-card) 25%,var(--border) 50%,var(--bg-card) 75%);background-size:400px 100%;animation:shimmer 1.5s infinite;}

  .app-layout{display:flex;height:100vh;overflow:hidden;}
  .sidebar{width:var(--sidebar-w);height:100vh;background:var(--bg-secondary);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;left:0;top:0;z-index:50;transition:transform .3s ease;}
  .sidebar.collapsed{transform:translateX(-100%);}
  .main-content{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;height:100vh;overflow:hidden;transition:margin-left .3s;}
  .main-content.full{margin-left:0;}
  .topbar{height:64px;background:var(--bg-secondary);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:16px;flex-shrink:0;}
  .page-content{flex:1;overflow-y:auto;padding:28px 28px;background:var(--bg-primary);}

  .card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;}
  .card-glass{background:var(--bg-glass);backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:var(--radius);}
  .stat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:22px;position:relative;overflow:hidden;transition:border-color .2s,transform .2s;}
  .stat-card:hover{border-color:var(--border-glow);transform:translateY(-2px);}
  .stat-card::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .2s;border-radius:var(--radius);}
  .stat-card.blue::before{background:radial-gradient(ellipse at top left,var(--accent-dim),transparent 60%);}
  .stat-card.purple::before{background:radial-gradient(ellipse at top left,var(--accent2-dim),transparent 60%);}
  .stat-card.green::before{background:radial-gradient(ellipse at top left,var(--green-dim),transparent 60%);}
  .stat-card.amber::before{background:radial-gradient(ellipse at top left,var(--amber-dim),transparent 60%);}
  .stat-card:hover::before{opacity:1;}

  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:var(--radius-sm);font-size:14px;font-weight:500;border:none;transition:all .2s;}
  .btn-primary{background:var(--accent);color:#0a0f1e;font-weight:600;}
  .btn-primary:hover{filter:brightness(1.1);box-shadow:0 4px 16px rgba(56,189,248,0.3);}
  .btn-primary:disabled{opacity:.55;cursor:not-allowed;filter:none;box-shadow:none;}
  .btn-outline{background:transparent;color:var(--text);border:1px solid var(--border);}
  .btn-outline:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-dim);}
  .btn-outline:disabled{opacity:.55;cursor:not-allowed;}
  .btn-ghost{background:transparent;color:var(--text-dim);border:none;}
  .btn-ghost:hover{background:var(--border);color:var(--text);}
  .btn-danger{background:var(--red-dim);color:var(--red);border:1px solid rgba(248,113,113,0.3);}
  .btn-danger:hover{background:var(--red);color:#fff;}
  .btn-sm{padding:6px 12px;font-size:13px;}
  .btn-lg{padding:14px 28px;font-size:16px;}

  .form-group{margin-bottom:18px;}
  .form-label{display:block;font-size:13px;font-weight:500;color:var(--text-dim);margin-bottom:6px;letter-spacing:.02em;}
  .form-input{width:100%;padding:11px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;}
  .form-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim);}
  .form-input::placeholder{color:var(--text-muted);}
  .form-input.error{border-color:var(--red);}
  .form-error{font-size:12px;color:var(--red);margin-top:4px;}

  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;}
  .badge-green{background:var(--green-dim);color:var(--green);}
  .badge-red{background:var(--red-dim);color:var(--red);}
  .badge-amber{background:var(--amber-dim);color:var(--amber);}
  .badge-blue{background:var(--accent-dim);color:var(--accent);}
  .badge-purple{background:var(--accent2-dim);color:var(--accent2);}

  .table-wrap{overflow-x:auto;border-radius:var(--radius);border:1px solid var(--border);}
  table{width:100%;border-collapse:collapse;}
  th{padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;background:var(--bg-secondary);border-bottom:1px solid var(--border);}
  td{padding:13px 16px;font-size:14px;border-bottom:1px solid var(--border);}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:rgba(255,255,255,.02);}

  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--radius-sm);font-size:14px;color:var(--text-dim);cursor:pointer;transition:all .15s;text-decoration:none;margin:1px 0;}
  .nav-item:hover{background:var(--accent-dim);color:var(--accent);}
  .nav-item.active{background:var(--accent-dim);color:var(--accent);font-weight:500;}
  .nav-item svg{width:18px;height:18px;flex-shrink:0;}
  .nav-section{font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;padding:12px 14px 4px;}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;}
  .modal{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:28px;max-width:520px;width:calc(100% - 40px);animation:fadeIn .25s ease;}

  .toast-container{position:fixed;bottom:24px;right:24px;z-index:200;display:flex;flex-direction:column;gap:10px;}
  .toast{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 18px;display:flex;align-items:center;gap:12px;font-size:14px;animation:slideIn .3s ease;min-width:280px;max-width:360px;box-shadow:0 8px 32px rgba(0,0,0,.4);}
  .toast-success{border-left:3px solid var(--green);}
  .toast-error{border-left:3px solid var(--red);}
  .toast-info{border-left:3px solid var(--accent);}

  .auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-primary);position:relative;overflow:hidden;}
  .auth-bg-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:60px 60px;opacity:.3;}
  .auth-bg-glow{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(56,189,248,.08),transparent 70%);top:-100px;right:-100px;}
  .auth-card{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:40px;width:100%;max-width:440px;position:relative;z-index:1;animation:fadeIn .5s ease;}
  .auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;}
  .auth-logo-icon{width:38px;height:38px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--text-muted);font-size:13px;}
  .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border);}

  .camera-wrap{background:var(--bg-secondary);border:2px dashed var(--border);border-radius:16px;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;position:relative;overflow:hidden;cursor:pointer;transition:border-color .2s;}
  .camera-wrap:hover{border-color:var(--accent);}
  .scan-line{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scanLine 2s ease-in-out infinite;}

  .progress-bar{height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;}
  .progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .4s ease;}

  .donut-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;}
  .donut-label{position:absolute;text-align:center;}

  .grid{display:grid;}
  .grid-2{grid-template-columns:repeat(2,1fr);gap:20px;}
  .grid-3{grid-template-columns:repeat(3,1fr);gap:20px;}
  .grid-4{grid-template-columns:repeat(4,1fr);gap:20px;}
  @media(max-width:1100px){.grid-4{grid-template-columns:repeat(2,1fr);}.grid-3{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:768px){
    .sidebar{transform:translateX(-100%);}
    .sidebar.open{transform:none;}
    .main-content{margin-left:0;}
    .grid-2,.grid-3,.grid-4{grid-template-columns:1fr;}
    .page-content{padding:16px;}
    .topbar{padding:0 16px;}
  }

  .flex{display:flex;} .items-center{align-items:center;} .justify-between{justify-content:space-between;}
  .gap-2{gap:8px;} .gap-3{gap:12px;} .gap-4{gap:16px;} .gap-6{gap:24px;}
  .mt-1{margin-top:4px;} .mt-2{margin-top:8px;} .mt-3{margin-top:12px;} .mt-4{margin-top:16px;} .mt-6{margin-top:24px;} .mt-8{margin-top:32px;}
  .mb-2{margin-bottom:8px;} .mb-4{margin-bottom:16px;} .mb-6{margin-bottom:24px;}
  .text-sm{font-size:13px;} .text-xs{font-size:12px;} .text-lg{font-size:18px;} .text-xl{font-size:22px;} .text-2xl{font-size:28px;} .text-3xl{font-size:36px;}
  .font-medium{font-weight:500;} .font-semibold{font-weight:600;} .font-bold{font-weight:700;}
  .text-muted{color:var(--text-muted);} .text-dim{color:var(--text-dim);} .text-accent{color:var(--accent);} .text-green{color:var(--green);} .text-red{color:var(--red);} .text-amber{color:var(--amber);}
  .mono{font-family:var(--font-mono);}
  .dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
  .dot-green{background:var(--green);} .dot-red{background:var(--red);} .dot-amber{background:var(--amber);}
  .divider{height:1px;background:var(--border);margin:16px 0;}
  .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .otp-input{width:48px;height:56px;text-align:center;font-size:22px;font-family:var(--font-mono);font-weight:700;background:var(--bg-secondary);border:1.5px solid var(--border);border-radius:var(--radius-sm);color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;}
  .otp-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim);}

  /* Mobile overlay — only renders on mobile viewports */
  .mobile-overlay{display:none;}
  @media(max-width:768px){.mobile-overlay{display:block;}}
`;

/* ─── Types ─── */
interface AppUser {
  username: string;
  email: string;
  name: string;
  initials: string;
  role: 'admin' | 'user';
  dept: string;
}

interface ToastItem {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'info';
}

type AppPage = 'dashboard' | 'mark' | 'history' | 'admin' | 'profile';
type AuthView = 'login' | 'register' | 'verify' | 'forgot';

/* ─── Contexts ─── */
interface AppContextValue {
  theme: string;
  toggleTheme: () => void;
  user: AppUser | null;
}

const AppContext = createContext<AppContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  user: null,
});
const useApp = () => useContext(AppContext);
// Suppress unused warning — useApp is available for child components
void useApp;

/* ─── Mock Data (analytics only — no mock auth) ─── */
const MOCK_ATTENDANCE = [
  { id: 1, date: '2025-07-14', checkIn: '09:02', checkOut: '18:15', status: 'present', confidence: 98.2, method: 'facial', location: 'HQ Mumbai' },
  { id: 2, date: '2025-07-13', checkIn: '09:18', checkOut: '17:45', status: 'present', confidence: 97.8, method: 'facial', location: 'HQ Mumbai' },
  { id: 3, date: '2025-07-12', checkIn: '-', checkOut: '-', status: 'absent', confidence: null, method: '-', location: '-' },
  { id: 4, date: '2025-07-11', checkIn: '09:05', checkOut: '18:30', status: 'present', confidence: 99.1, method: 'facial', location: 'HQ Mumbai' },
  { id: 5, date: '2025-07-10', checkIn: '10:15', checkOut: '17:00', status: 'late', confidence: 96.5, method: 'upload', location: 'Remote' },
  { id: 6, date: '2025-07-09', checkIn: '09:00', checkOut: '18:00', status: 'present', confidence: 98.9, method: 'facial', location: 'HQ Mumbai' },
  { id: 7, date: '2025-07-08', checkIn: '09:12', checkOut: '18:22', status: 'present', confidence: 97.3, method: 'facial', location: 'HQ Mumbai' },
  { id: 8, date: '2025-07-07', checkIn: '-', checkOut: '-', status: 'absent', confidence: null, method: '-', location: '-' },
  { id: 9, date: '2025-07-06', checkIn: '09:00', checkOut: '18:00', status: 'present', confidence: 99.4, method: 'facial', location: 'HQ Mumbai' },
  { id: 10, date: '2025-07-05', checkIn: '09:00', checkOut: '18:00', status: 'present', confidence: 98.1, method: 'facial', location: 'HQ Mumbai' },
];

const MOCK_ADMIN_USERS = [
  { id: 1, name: 'Priya Nair', email: 'priya@smartattend.io', role: 'user', dept: 'Design', avatar: 'PN', status: 'active', joined: '2024-02-20' },
  { id: 2, name: 'Rahul Mehta', email: 'rahul@smartattend.io', role: 'user', dept: 'Marketing', avatar: 'RM', status: 'inactive', joined: '2024-03-10' },
  { id: 3, name: 'Sneha Patel', email: 'sneha@smartattend.io', role: 'user', dept: 'Engineering', avatar: 'SP', status: 'active', joined: '2024-01-28' },
  { id: 4, name: 'Dev Kumar', email: 'dev@smartattend.io', role: 'user', dept: 'HR', avatar: 'DK', status: 'active', joined: '2024-04-05' },
  { id: 5, name: 'Kavita Joshi', email: 'kavita@smartattend.io', role: 'user', dept: 'Finance', avatar: 'KJ', status: 'active', joined: '2024-02-14' },
];

const ACTIVITY_FEED = [
  { id: 1, user: 'Priya Nair', action: 'Marked attendance via facial recognition', time: '2 min ago', type: 'success', dept: 'Design' },
  { id: 2, user: 'Dev Kumar', action: 'Attendance marked successfully', time: '8 min ago', type: 'success', dept: 'HR' },
  { id: 3, user: 'Rahul Mehta', action: 'Face recognition failed — manual override', time: '22 min ago', type: 'warning', dept: 'Marketing' },
  { id: 4, user: 'Kavita Joshi', action: 'Marked attendance via image upload', time: '35 min ago', type: 'success', dept: 'Finance' },
  { id: 5, user: 'Sneha Patel', action: 'Marked attendance via facial recognition', time: '1 hr ago', type: 'success', dept: 'Engineering' },
];

/* ─── Cognito Auth Service ─── */
const authService = {
  async login(email: string, password: string) {
    // signOut any existing session first to avoid "already signed in" error
    try { await signOut(); } catch { /* no active session, safe to continue */ }
    const result = await signIn({ username: email, password });
    return result;
  },

  async register(email: string, password: string, name: string) {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
    return result;
  },

  async verify(email: string, code: string) {
    const result = await confirmSignUp({ username: email, confirmationCode: code });
    return result;
  },

  async resendCode(email: string) {
    await resendSignUpCode({ username: email });
  },

  async forgotPassword(email: string) {
    await resetPassword({ username: email });
  },

  async logout() {
    await signOut({ global: true });
  },

  async getSession() {
    return await fetchAuthSession();
  },

  async getIdToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      return await getCurrentUser();
    } catch {
      return null;
    }
  },
};

/* ─── useAuth hook ─── */
function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const buildAppUser = useCallback((cognitoUser: AuthUser): AppUser => {
    const email = cognitoUser.signInDetails?.loginId ?? cognitoUser.username ?? '';
    const nameParts = email.split('@')[0].split('.');
    const name = nameParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    const initials = nameParts.map((p: string) => p.charAt(0).toUpperCase()).join('').slice(0, 2);
    return {
      username: cognitoUser.username,
      email,
      name,
      initials,
      role: 'admin', // extend via Cognito groups in production
      dept: 'Engineering',
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const cognitoUser = await authService.getCurrentUser();
      setUser(cognitoUser ? buildAppUser(cognitoUser) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [buildAppUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh, setUser, buildAppUser };
}

/* ─── Attendance API service ─── */
const attendanceService = {
  async markAttendance(imageData: string) {
    const token = await authService.getIdToken();
    // In production: replace with real API Gateway call:
    // await fetch('https://<api-id>.execute-api.<region>.amazonaws.com/prod/attendance/mark', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ image: imageData }),
    // });
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    return {
      success: true,
      confidence: parseFloat((96 + Math.random() * 3.5).toFixed(1)),
      message: 'Attendance marked via AI facial recognition',
      timestamp: new Date().toISOString(),
      token: token ? token.slice(0, 20) + '…' : 'session-active',
    };
  },

  async uploadFaceImage(file: File, username: string): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const key = `faces/${username}/profile.${ext}`;
    await uploadData({
      key,
      data: file,
      options: { contentType: file.type },
    }).result;
    return key;
  },

  async uploadAttendanceImage(dataUrl: string, username: string): Promise<string> {
    // Convert base64 data URL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const key = `attendance/${username}/${Date.now()}.jpg`;
    await uploadData({
      key,
      data: blob,
      options: { contentType: 'image/jpeg' },
    }).result;
    return key;
  },

  async getHistory() {
    await new Promise((r) => setTimeout(r, 500));
    return { records: MOCK_ATTENDANCE, total: MOCK_ATTENDANCE.length };
  },

  async getAdminUsers() {
    await new Promise((r) => setTimeout(r, 500));
    return { users: MOCK_ADMIN_USERS, total: MOCK_ADMIN_USERS.length };
  },

  async getAnalytics() {
    await new Promise((r) => setTimeout(r, 400));
    return { totalUsers: 6, activeToday: 4, avgAttendance: 87.3, systemLoad: 34 };
  },
};

/* ─── Icons ─── */
interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

const Icon = ({ name, size = 18, color = 'currentColor', className }: IconProps) => {
  const icons: Record<string, React.ReactElement> = {
    logo: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    dashboard: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    camera: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    history: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    users: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    settings: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93M22 12h-2M4 12H2M12 22v-2M12 4V2"/></svg>,
    bell: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    sun: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    menu: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    x: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    upload: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    scan: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    arrow: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    logout: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    shield: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    cloud: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
    cpu: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    bar: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    eye: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    user: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    plus: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    edit: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    download: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    search: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    filter: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    check_circle: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    alert: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    lock: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    mail: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    refresh: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    face: <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  };
  return icons[name] ?? icons['camera'];
};

/* ─── Toast system ─── */
let toastId = 0;
const ToastContext = createContext<{ add: (msg: string, type?: ToastItem['type'], duration?: number) => void }>({
  add: () => {},
});

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((msg: string, type: ToastItem['type'] = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ add }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && <Icon name="check_circle" size={16} color="var(--green)" />}
            {t.type === 'error' && <Icon name="alert" size={16} color="var(--red)" />}
            {t.type === 'info' && <Icon name="bell" size={16} color="var(--accent)" />}
            <span style={{ flex: 1 }}>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => useContext(ToastContext);

/* ─── Spinner ─── */
const Spinner = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin .7s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeOpacity=".2" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

/* ─── Skeleton ─── */
const Skel = ({ h = 20, w = '100%', br = 6, mt = 0 }: { h?: number; w?: number | string; br?: number; mt?: number }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: br, marginTop: mt }} />
);

/* ─── Avatar ─── */
const Avatar = ({ initials, size = 36, color = 'accent' }: { initials: string; size?: number; color?: string }) => {
  const bg: Record<string, string> = { accent: 'var(--accent-dim)', purple: 'var(--accent2-dim)', green: 'var(--green-dim)', amber: 'var(--amber-dim)' };
  const fg: Record<string, string> = { accent: 'var(--accent)', purple: 'var(--accent2)', green: 'var(--green)', amber: 'var(--amber)' };
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg[color] ?? bg.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 600, color: fg[color] ?? fg.accent, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

/* ─── Donut Chart ─── */
const DonutChart = ({ percent, size = 120, color = 'var(--accent)' }: { percent: number; size?: number; color?: string }) => {
  const r = 44, circ = 2 * Math.PI * r, stroke = circ * (1 - percent / 100);
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={stroke}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="donut-label">
        <div style={{ fontSize: size * 0.2, fontWeight: 700, color: 'var(--text)' }}>{percent}%</div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   AUTH PAGES
══════════════════════════════════ */

interface AuthPageProps {
  onAuthenticated: () => void;
}

const AuthPage = ({ onAuthenticated }: AuthPageProps) => {
  const [view, setView] = useState<AuthView>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const toast = useToast();

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />
      <div className="auth-bg-glow" />

      <div style={{ position: 'absolute', top: 40, left: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {['AWS Lambda', 'Amazon Rekognition', 'DynamoDB', 'API Gateway'].map((s, i) => (
          <div key={i} className="badge badge-blue" style={{ fontSize: 11, animation: 'float 3s ease-in-out infinite', animationDelay: i * 500 + 'ms' }}>
            <Icon name="cloud" size={12} />{s}
          </div>
        ))}
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Icon name="scan" size={20} color="#0a0f1e" /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>SmartAttend</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AI-Powered · Serverless · AWS</div>
          </div>
        </div>

        {view === 'login' && (
          <LoginForm
            onSuccess={onAuthenticated}
            onRegister={() => setView('register')}
            onForgot={() => setView('forgot')}
          />
        )}
        {view === 'register' && (
          <RegisterForm
            onSuccess={(email) => { setPendingEmail(email); setView('verify'); }}
            onLogin={() => setView('login')}
          />
        )}
        {view === 'verify' && (
          <VerifyForm
            email={pendingEmail}
            onSuccess={() => { toast.add('Email verified! Please sign in.', 'success'); setView('login'); }}
            onBack={() => setView('register')}
          />
        )}
        {view === 'forgot' && (
          <ForgotForm
            onSuccess={() => { toast.add('Password reset email sent. Check your inbox.', 'info'); setView('login'); }}
            onBack={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Login Form ─── */
const LoginForm = ({ onSuccess, onRegister, onForgot }: { onSuccess: () => void; onRegister: () => void; onForgot: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.isSignedIn) {
        toast.add('Welcome back!', 'success');
        onSuccess();
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        toast.add('Please verify your email first.', 'info');
      } else {
        toast.add('Additional verification required.', 'info');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      toast.add(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="text-xl font-bold">Welcome back</div>
        <div className="text-sm text-dim" style={{ marginTop: 4 }}>Sign in with your Cognito credentials</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <input className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@company.com" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: 38 }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="mail" size={15} />
            </div>
          </div>
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className={`form-input ${errors.password ? 'error' : ''}`} placeholder="••••••••"
              type={showPass ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: 38, paddingRight: 40 }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="lock" size={15} />
            </div>
            <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setShowPass(!showPass)}>
              <Icon name={showPass ? 'eyeOff' : 'eye'} size={15} />
            </button>
          </div>
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>
        <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 16 }}>
          <span className="text-sm text-accent" style={{ cursor: 'pointer' }} onClick={onForgot}>Forgot password?</span>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
          {loading ? <><Spinner size={16} /> Signing in…</> : <>Sign In <Icon name="arrow" size={16} /></>}
        </button>
      </form>
      <div className="text-sm text-center" style={{ marginTop: 20, color: 'var(--text-dim)' }}>
        Don&apos;t have an account?{' '}
        <span className="text-accent" style={{ cursor: 'pointer' }} onClick={onRegister}>Sign up free</span>
      </div>
    </>
  );
};

/* ─── Register Form ─── */
const RegisterForm = ({ onSuccess, onLogin }: { onSuccess: (email: string) => void; onLogin: () => void }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register(form.email, form.password, form.name);
      toast.add('Account created! Check your email for a verification code.', 'success');
      onSuccess(form.email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      toast.add(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="text-xl font-bold">Create account</div>
        <div className="text-sm text-dim" style={{ marginTop: 4 }}>Join SmartAttend — AI attendance tracking</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Your Name"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@company.com" type="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>
        <div className="grid-2 grid" style={{ gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min 8 chars"
                type={showPass ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ paddingRight: 36 }} />
              <button type="button" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowPass(!showPass)}>
                <Icon name={showPass ? 'eyeOff' : 'eye'} size={14} />
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm</label>
            <input className={`form-input ${errors.confirm ? 'error' : ''}`} placeholder="Repeat password" type="password"
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
            {errors.confirm && <div className="form-error">{errors.confirm}</div>}
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
          {loading ? <><Spinner size={16} /> Creating account…</> : <>Create Account <Icon name="arrow" size={16} /></>}
        </button>
      </form>
      <div className="text-sm text-center" style={{ marginTop: 20, color: 'var(--text-dim)' }}>
        Already have an account?{' '}
        <span className="text-accent" style={{ cursor: 'pointer' }} onClick={onLogin}>Sign in</span>
      </div>
    </>
  );
};

/* ─── Verify Form (OTP) ─── */
const VerifyForm = ({ email, onSuccess, onBack }: { email: string; onSuccess: () => void; onBack: () => void }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const toast = useToast();

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) setCode(paste.split(''));
    e.preventDefault();
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) { toast.add('Please enter the 6-digit code', 'error'); return; }
    setLoading(true);
    try {
      await authService.verify(email, fullCode);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed.';
      toast.add(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendCode(email);
      toast.add('Verification code resent!', 'info');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend code.';
      toast.add(message, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="text-xl font-bold">Verify your email</div>
        <div className="text-sm text-dim" style={{ marginTop: 4 }}>Enter the 6-digit code sent to <strong>{email}</strong></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
          {loading ? <><Spinner size={16} /> Verifying…</> : <>Verify Email <Icon name="check" size={16} /></>}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="text-sm text-dim">
          Didn&apos;t receive it?{' '}
          <span className="text-accent" style={{ cursor: 'pointer' }} onClick={handleResend}>
            {resending ? 'Sending…' : 'Resend code'}
          </span>
        </span>
        <span className="text-sm text-accent" style={{ cursor: 'pointer' }} onClick={onBack}>← Back to registration</span>
      </div>
    </>
  );
};

/* ─── Forgot Password Form ─── */
const ForgotForm = ({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { toast.add('Email is required', 'error'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email.';
      toast.add(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="text-xl font-bold">Reset password</div>
        <div className="text-sm text-dim" style={{ marginTop: 4 }}>We&apos;ll send a Cognito reset link to your email</div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" placeholder="you@company.com" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
          {loading ? <><Spinner size={16} /> Sending…</> : <>Send Reset Link <Icon name="arrow" size={16} /></>}
        </button>
      </form>
      <div className="text-sm text-center" style={{ marginTop: 20, color: 'var(--text-dim)' }}>
        Remember it?{' '}
        <span className="text-accent" style={{ cursor: 'pointer' }} onClick={onBack}>Back to login</span>
      </div>
    </>
  );
};

/* ══════════════════════════════════
   APP SHELL
══════════════════════════════════ */

const NAV_ITEMS = [
  { id: 'dashboard' as AppPage, label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'user'] },
  { id: 'mark' as AppPage, label: 'Mark Attendance', icon: 'camera', roles: ['admin', 'user'] },
  { id: 'history' as AppPage, label: 'Attendance History', icon: 'history', roles: ['admin', 'user'] },
  { id: 'admin' as AppPage, label: 'Admin Panel', icon: 'shield', roles: ['admin'] },
  { id: 'profile' as AppPage, label: 'Profile Settings', icon: 'settings', roles: ['admin', 'user'] },
];

interface SidebarProps {
  page: AppPage;
  setPage: (p: AppPage) => void;
  user: AppUser;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const Sidebar = ({ page, setPage, user, onLogout, collapsed, setCollapsed }: SidebarProps) => {
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="scan" size={18} color="#0a0f1e" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>SmartAttend</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AI · Serverless · AWS</div>
          </div>
        </div>
        <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setCollapsed(true)}>
          <Icon name="x" size={16} />
        </button>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={user.initials} size={36} />
        <div style={{ overflow: 'hidden' }}>
          <div className="truncate font-medium text-sm">{user.name}</div>
          <div className="text-xs text-muted">{user.role === 'admin' ? 'Administrator' : 'Member'} · {user.dept}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        <div className="nav-section">Navigation</div>
        {items.map((item) => (
          <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => { setPage(item.id); setCollapsed(true); }}>
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="nav-section" style={{ marginTop: 12 }}>System</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <Icon name="cloud" size={18} />
          <span>AWS Cloud</span>
          <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px' }}>Live</span>
        </div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <Icon name="cpu" size={18} />
          <span>Rekognition</span>
          <span className="badge badge-green" style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 6px' }}>Active</span>
        </div>
      </div>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div className="nav-item" onClick={onLogout} style={{ color: 'var(--red)' }}>
          <Icon name="logout" size={18} />
          <span>Sign Out</span>
        </div>
      </div>
    </nav>
  );
};

interface TopbarProps {
  page: AppPage;
  user: AppUser;
  theme: string;
  toggleTheme: () => void;
  onMenuClick: () => void;
}

const Topbar = ({ page, user, theme, toggleTheme, onMenuClick }: TopbarProps) => {
  const [showUser, setShowUser] = useState(false);
  const pageTitles: Record<AppPage, string> = {
    dashboard: 'Dashboard',
    mark: 'Mark Attendance',
    history: 'Attendance History',
    admin: 'Admin Panel',
    profile: 'Profile Settings',
  };
  return (
    <div className="topbar">
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onMenuClick}>
        <Icon name="menu" size={20} />
      </button>
      <div style={{ flex: 1 }}>
        <div className="font-semibold" style={{ fontSize: 16 }}>{pageTitles[page]}</div>
        <div className="text-xs text-muted" style={{ fontFamily: 'var(--font-mono)' }}>AWS · Rekognition · Lambda · DynamoDB</div>
      </div>

      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={toggleTheme}>
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>

      <div style={{ position: 'relative' }}>
        <button className="btn btn-ghost" style={{ padding: 4, gap: 8, display: 'flex', alignItems: 'center' }}
          onClick={() => setShowUser(!showUser)}>
          <Avatar initials={user.initials} size={32} />
        </button>
        {showUser && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, minWidth: 200, zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,.3)' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-xs text-muted">{user.email}</div>
              <div className="text-xs text-muted" style={{ fontFamily: 'var(--font-mono)', marginTop: 2, color: 'var(--accent)' }}>Cognito ID: {user.username.slice(0, 16)}…</div>
            </div>
            <div className="nav-item text-sm" onClick={() => setShowUser(false)}>
              <Icon name="user" size={15} /> View Profile
            </div>
            <div className="nav-item text-sm" onClick={() => setShowUser(false)}>
              <Icon name="settings" size={15} /> Settings
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════
   PAGES
══════════════════════════════════ */

/* ─── Dashboard ─── */
const DashboardPage = ({ user }: { user: AppUser }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceService.getAnalytics().then(() => setLoading(false));
  }, []);

  const firstName = user.name.split(' ')[0];

  const stats = [
    { label: 'Present This Month', value: '22/25', sub: 'Days', icon: 'check_circle', color: 'green', delta: '+2 vs last month' },
    { label: 'Attendance Rate', value: '88%', sub: 'Average', icon: 'bar', color: 'blue', delta: '↑ 3.2% this week' },
    { label: 'Streak', value: '7', sub: 'Consecutive days', icon: 'shield', color: 'purple', delta: 'Personal best!' },
    { label: 'AI Confidence', value: '98.4%', sub: 'Avg recognition', icon: 'cpu', color: 'amber', delta: 'Rekognition v2' },
  ];

  return (
    <div className="animate-fade">
      <div className="card" style={{ background: 'linear-gradient(135deg,rgba(56,189,248,.12),rgba(129,140,248,.08))', border: '1px solid var(--border-glow)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: .05, pointerEvents: 'none' }}>
          <Icon name="scan" size={160} color="var(--accent)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Good morning, {firstName} 👋</div>
            <div className="text-dim text-sm" style={{ marginTop: 4 }}>
              Signed in as <strong style={{ color: 'var(--accent)' }}>{user.email}</strong>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-green"><span className="dot dot-green" />Session Active</span>
              <span className="badge badge-blue"><Icon name="cloud" size={10} />AWS Lambda</span>
              <span className="badge badge-purple"><Icon name="cpu" size={10} />Rekognition Online</span>
            </div>
          </div>
          <DonutChart percent={88} size={100} />
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card ${s.color === 'blue' ? 'blue' : s.color === 'purple' ? 'purple' : s.color === 'green' ? 'green' : 'amber'}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `var(--${s.color === 'blue' ? 'accent' : s.color === 'purple' ? 'accent2' : s.color}-dim)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={17} color={`var(--${s.color === 'blue' ? 'accent' : s.color === 'purple' ? 'accent2' : s.color})`} />
              </div>
            </div>
            {loading ? <Skel h={32} w={80} /> : (
              <>
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 8 }}>{s.delta}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid-2 grid" style={{ gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="font-semibold">Weekly Attendance</div>
              <div className="text-xs text-muted">Last 6 weeks overview</div>
            </div>
            <span className="badge badge-blue">Jun–Jul 2025</span>
          </div>
          <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 8px' }}>
            {[
              { week: 'W1', present: 22, absent: 1, late: 2 },
              { week: 'W2', present: 20, absent: 3, late: 2 },
              { week: 'W3', present: 23, absent: 1, late: 1 },
              { week: 'W4', present: 21, absent: 2, late: 2 },
              { week: 'W5', present: 24, absent: 1, late: 0 },
              { week: 'W6', present: 22, absent: 2, late: 1 },
            ].map((d) => {
              const total = d.present + d.absent + d.late;
              return (
                <div key={d.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ height: (d.late / total) * 140, background: 'var(--amber)', borderRadius: '3px 3px 0 0', opacity: .8 }} />
                    <div style={{ height: (d.absent / total) * 140, background: 'var(--red)', opacity: .8 }} />
                    <div style={{ height: (d.present / total) * 140, background: 'var(--accent)', borderRadius: '0 0 3px 3px', opacity: .9 }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.week}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[{ c: 'var(--accent)', l: 'Present' }, { c: 'var(--red)', l: 'Absent' }, { c: 'var(--amber)', l: 'Late' }].map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />{l}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="font-semibold">Live Activity</div>
              <div className="text-xs text-muted">Real-time attendance events</div>
            </div>
            <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}><span className="dot dot-green" />Live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ACTIVITY_FEED.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < ACTIVITY_FEED.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <Avatar initials={a.user.split(' ').map((n) => n[0]).join('')} size={32} color={a.type === 'warning' ? 'amber' : 'accent'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.user} <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>· {a.dept}</span></div>
                  <div className="text-xs text-muted truncate">{a.action}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</div>
                </div>
                {a.type === 'warning' ? <Icon name="alert" size={14} color="var(--amber)" /> : <Icon name="check" size={14} color="var(--green)" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="font-semibold mb-4">AWS Cloud Services</div>
        <div className="grid grid-4" style={{ gap: 12 }}>
          {[
            { name: 'Lambda Functions', status: 'Running', load: '23%', color: 'green' },
            { name: 'Rekognition API', status: 'Active', load: 'Active', color: 'green' },
            { name: 'DynamoDB', status: 'Healthy', load: '12ms', color: 'green' },
            { name: 'API Gateway', status: 'Online', load: '99.9%', color: 'green' },
            { name: 'S3 Storage', status: 'Available', load: '4.2 GB', color: 'green' },
            { name: 'CloudWatch', status: 'Monitoring', load: '24/7', color: 'blue' },
            { name: 'Cognito', status: 'Running', load: 'Active', color: 'green' },
            { name: 'CloudFront CDN', status: 'Active', load: '<10ms', color: 'blue' },
          ].map((s) => (
            <div key={s.name} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Icon name="cloud" size={14} color={`var(--${s.color === 'blue' ? 'accent' : s.color})`} />
                <span className={`badge badge-${s.color === 'blue' ? 'blue' : 'green'}`} style={{ fontSize: 10, padding: '1px 6px' }}>{s.status}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{s.load}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Mark Attendance ─── */
const MarkAttendancePage = ({ user }: { user: AppUser }) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ confidence: number; timestamp: string; token: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const toast = useToast();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraOn(true); }
    } catch {
      toast.add('Camera access denied. Use image upload instead.', 'error');
    }
  };

  const submitAttendance = async (imageData: string) => {
    setStatus('scanning'); setProgress(0); setResult(null);
    const interval = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 180);
    try {
      // Upload snapshot to S3
      await attendanceService.uploadAttendanceImage(imageData, user.username);
      const res = await attendanceService.markAttendance(imageData);
      clearInterval(interval); setProgress(100);
      setTimeout(() => { setStatus('success'); setResult(res); toast.add(`Attendance marked! Confidence: ${res.confidence}%`, 'success'); }, 400);
    } catch {
      clearInterval(interval); setStatus('error');
      toast.add('Face recognition failed. Please retry.', 'error');
    }
  };

  const capture = () => {
    if (!videoRef.current || !cameraOn) { toast.add('Please start the camera first', 'error'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL('image/jpeg');
    setPreview(data); stopCamera(); submitAttendance(data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setPreview(data); submitAttendance(data);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => { setStatus('idle'); setProgress(0); setResult(null); setPreview(null); };

  return (
    <div className="animate-fade" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, background: 'var(--bg-secondary)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {([{ id: 'camera', label: 'Live Camera', icon: 'camera' }, { id: 'upload', label: 'Upload Image', icon: 'upload' }] as const).map((m) => (
          <button key={m.id} className={`btn ${mode === m.id ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '8px 16px' }}
            onClick={() => { setMode(m.id); reset(); stopCamera(); }}>
            <Icon name={m.icon} size={16} />{m.label}
          </button>
        ))}
      </div>

      <div className="grid-2 grid" style={{ gap: 20 }}>
        <div className="card">
          <div className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={mode === 'camera' ? 'camera' : 'upload'} size={18} color="var(--accent)" />
            {mode === 'camera' ? 'Facial Recognition' : 'Image Upload'}
          </div>

          {mode === 'camera' ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-secondary)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }} />
              {!cameraOn && !preview && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Icon name="camera" size={48} color="var(--border)" />
                  <div style={{ fontSize: 13, marginTop: 12 }}>Camera inactive</div>
                </div>
              )}
              {preview && <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Captured" />}
              {cameraOn && <div className="scan-line" />}
              {cameraOn && (
                <>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span className="badge badge-red" style={{ animation: 'pulse 1s infinite' }}><span className="dot dot-red" />REC</span>
                  </div>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 640 480">
                    <rect x="220" y="100" width="200" height="200" rx="8" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="20 8" />
                    {[[220, 100], [420, 100], [220, 300], [420, 300]].map(([x, y], i) => (
                      <g key={i}>
                        <path d={`M${x} ${y} L${x + (x < 400 ? 20 : -20)} ${y}`} stroke="var(--accent)" strokeWidth="3" />
                        <path d={`M${x} ${y} L${x} ${y + (y < 200 ? 20 : -20)}`} stroke="var(--accent)" strokeWidth="3" />
                      </g>
                    ))}
                  </svg>
                </>
              )}
            </div>
          ) : (
            <label style={{ cursor: 'pointer' }}>
              <div className="camera-wrap" style={{ minHeight: 200 }}>
                {preview ? (
                  <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} alt="Uploaded" />
                ) : (
                  <>
                    <Icon name="upload" size={36} color="var(--border)" />
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                      <div style={{ fontWeight: 500 }}>Click to upload or capture photo</div>
                      <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG up to 5MB · Camera supported on mobile</div>
                    </div>
                  </>
                )}
              </div>
              {/* capture="user" enables front-facing camera on mobile devices */}
              <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {mode === 'camera' && !cameraOn && status === 'idle' && (
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={startCamera}>
                <Icon name="camera" size={16} />Start Camera
              </button>
            )}
            {mode === 'camera' && cameraOn && (
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', animation: 'glowPulse 2s infinite' }} onClick={capture}>
                <Icon name="scan" size={16} />Capture & Verify
              </button>
            )}
            {(status === 'success' || status === 'error') && (
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={reset}>
                Try Again
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="cpu" size={18} color="var(--accent2)" />AWS Rekognition
          </div>

          {status === 'idle' && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="scan" size={28} color="var(--border)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Ready for facial recognition</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Powered by Amazon Rekognition</div>
            </div>
          )}

          {status === 'scanning' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'glowPulse 1.5s infinite' }}>
                <Spinner size={28} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>Analyzing facial features…</div>
              <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>Connecting to AWS Rekognition</div>
              <div style={{ marginTop: 16 }}>
                <div className="progress-bar"><div className="progress-fill" style={{ width: progress + '%' }} /></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{progress}%</div>
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                {['Detecting face boundaries', 'Extracting facial landmarks', 'Matching against database', 'Verifying identity'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    {progress >= (i + 1) * 25
                      ? <Icon name="check" size={14} color="var(--green)" />
                      : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)' }} />}
                    <span style={{ color: progress >= (i + 1) * 25 ? 'var(--text)' : 'var(--text-muted)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'success' && result && (
            <div style={{ animation: 'fadeIn .4s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon name="check" size={28} color="var(--green)" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>Attendance Marked!</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Identity verified via Cognito + Rekognition</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { k: 'Confidence Score', v: result.confidence + '%', c: 'var(--green)' },
                  { k: 'Check-in Time', v: new Date().toLocaleTimeString(), c: 'var(--text)' },
                  { k: 'Verification Method', v: 'AWS Rekognition', c: 'var(--accent)' },
                  { k: 'Session Token', v: result.token, c: 'var(--accent2)' },
                  { k: 'Status', v: 'Present', c: 'var(--green)' },
                ].map(({ k, v, c }) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: c, fontFamily: 'var(--font-mono)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--red-dim)', border: '2px solid var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="x" size={28} color="var(--red)" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)' }}>Recognition Failed</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Could not verify identity. Ensure your face is clearly visible and well-lit.</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 14, marginTop: 20 }}>
        {[
          { icon: 'shield', title: 'Liveness Detection', desc: 'Prevents spoofing with depth maps', color: 'accent' },
          { icon: 'cloud', title: 'Serverless Processing', desc: 'AWS Lambda + Rekognition pipeline', color: 'accent2' },
          { icon: 'lock', title: 'Encrypted Storage', desc: 'Face vectors stored in DynamoDB', color: 'green' },
        ].map((c) => (
          <div key={c.title} className="card" style={{ padding: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `var(--${c.color === 'green' ? 'green' : 'accent'}-dim)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon name={c.icon} size={18} color={`var(--${c.color === 'green' ? 'green' : c.color === 'accent2' ? 'accent2' : 'accent'})`} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── History Page ─── */
const HistoryPage = () => {
  const [records, setRecords] = useState<typeof MOCK_ATTENDANCE>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const toast = useToast();
  const PER_PAGE = 5;

  useEffect(() => {
    attendanceService.getHistory().then((res) => { setRecords(res.records); setLoading(false); });
  }, []);

  const filtered = records.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (search && !r.date.includes(search) && !r.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <div className="animate-fade">
      <div className="grid grid-4 mb-6" style={{ gap: 14 }}>
        {[
          { l: 'Total Days', v: records.length, c: 'accent' },
          { l: 'Present', v: records.filter((r) => r.status === 'present').length, c: 'green' },
          { l: 'Absent', v: records.filter((r) => r.status === 'absent').length, c: 'red' },
          { l: 'Late', v: records.filter((r) => r.status === 'late').length, c: 'amber' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{s.l}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.c === 'green' ? 'var(--green)' : s.c === 'red' ? 'var(--red)' : s.c === 'amber' ? 'var(--amber)' : 'var(--text)' }}>
              {loading ? '—' : s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <input className="form-input" placeholder="Search records…" value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
            <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="search" size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'present', 'absent', 'late'].map((f) => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setFilter(f); setCurrentPage(1); }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" className="form-input" style={{ width: 140, padding: '8px 10px', fontSize: 13 }}
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
            <input type="date" className="form-input" style={{ width: 140, padding: '8px 10px', fontSize: 13 }}
              value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => toast.add('Report exported as CSV', 'success')}>
            <Icon name="download" size={15} />Export
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Check In</th><th>Check Out</th>
              <th>Status</th><th>Method</th><th>AI Confidence</th><th>Location</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{Array(7).fill(0).map((_, j) => <td key={j}><Skel h={16} /></td>)}</tr>
              ))
              : paginated.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>No records found</td></tr>
                : paginated.map((r) => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.date}</span></td>
                    <td><span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.checkIn}</span></td>
                    <td><span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.checkOut}</span></td>
                    <td>
                      <span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'absent' ? 'badge-red' : 'badge-amber'}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.method}</span></td>
                    <td>
                      {r.confidence ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60, height: 4 }}>
                            <div className="progress-fill" style={{ width: r.confidence + '%' }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{r.confidence}%</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.location}</span></td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i + 1} className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="btn btn-outline btn-sm" disabled={currentPage === pages} onClick={() => setCurrentPage((p) => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Admin Panel ─── */
interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  dept: string;
  avatar: string;
  status: string;
  joined: string;
}

const AdminPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', dept: '', role: 'user' });
  const toast = useToast();

  useEffect(() => {
    attendanceService.getAdminUsers().then((res) => { setUsers(res.users); setLoading(false); });
  }, []);

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) { toast.add('Please fill in all required fields', 'error'); return; }
    const u: AdminUser = {
      ...newUser,
      id: Date.now(),
      avatar: newUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
      status: 'active',
      joined: new Date().toLocaleDateString('en-CA'),
    };
    setUsers((prev) => [...prev, u]);
    setShowModal(false);
    setNewUser({ name: '', email: '', dept: '', role: 'user' });
    toast.add(`User ${u.name} added successfully`, 'success');
  };

  return (
    <div className="animate-fade">
      <div className="grid grid-4 mb-6" style={{ gap: 14 }}>
        {[
          { l: 'Total Users', v: users.length, icon: 'users', c: 'blue' },
          { l: 'Active Today', v: 4, icon: 'check_circle', c: 'green' },
          { l: 'Avg Attendance', v: '87.3%', icon: 'bar', c: 'purple' },
          { l: 'System Load', v: '34%', icon: 'cpu', c: 'amber' },
        ].map((card, i) => (
          <div key={i} className={`stat-card ${card.c === 'blue' ? 'blue' : card.c === 'green' ? 'green' : card.c === 'purple' ? 'purple' : 'amber'}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Icon name={card.icon} size={20} color={`var(--${card.c === 'blue' ? 'accent' : card.c === 'green' ? 'green' : card.c === 'purple' ? 'accent2' : 'amber'})`} />
              <span className="badge badge-blue" style={{ fontSize: 10 }}>Live</span>
            </div>
            {loading ? <Skel h={30} w={80} mt={6} /> : (
              <>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{card.v}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{card.l}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid-2 grid mb-6" style={{ gap: 20 }}>
        <div className="card">
          <div className="font-semibold mb-4">Department Breakdown</div>
          {['Engineering', 'Design', 'Marketing', 'HR', 'Finance'].map((dept, i) => {
            const count = users.filter((u) => u.dept === dept).length;
            const pct = users.length ? Math.round((count / users.length) * 100) : 0;
            return (
              <div key={dept} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span>{dept}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{count} · {pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: pct + '%', background: `hsl(${i * 60},70%,55%)` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="font-semibold mb-4">API Activity Overview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { endpoint: 'POST /api/attendance/mark', calls: 1247, status: '200', ms: 89 },
              { endpoint: 'GET /api/attendance/history', calls: 892, status: '200', ms: 45 },
              { endpoint: 'POST /api/auth/login', calls: 234, status: '200', ms: 120 },
              { endpoint: 'GET /api/admin/users', calls: 156, status: '200', ms: 34 },
              { endpoint: 'POST /api/auth/register', calls: 67, status: '201', ms: 230 },
            ].map((a) => (
              <div key={a.endpoint} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>{a.status}</span>
                <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-dim)' }}>{a.endpoint}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.calls}</span>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{a.ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="font-semibold">User Management</div>
            <div className="text-xs text-muted">{users.length} registered accounts</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Icon name="plus" size={15} />Add User
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Department</th><th>Role</th>
                <th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(4).fill(0).map((_, i) => (
                  <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><Skel h={16} /></td>)}</tr>
                ))
                : users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar initials={u.avatar} size={30} color={u.role === 'admin' ? 'purple' : 'accent'} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{u.dept}</span></td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        <span className={`dot dot-${u.status === 'active' ? 'green' : 'red'}`} />{u.status}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{u.joined}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => toast.add('Editing ' + u.name, 'info')}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                          onClick={() => { if (window.confirm('Remove ' + u.name + '?')) { setUsers((prev) => prev.filter((x) => x.id !== u.id)); toast.add(u.name + ' removed', 'success'); } }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div className="font-semibold text-lg">Add New User</div>
              <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setShowModal(false)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Priya Nair" value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" placeholder="priya@company.com" type="email" value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="grid-2 grid" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={newUser.dept} onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })}>
                  <option value="">Select…</option>
                  {['Engineering', 'Design', 'Marketing', 'HR', 'Finance'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddUser}>
                <Icon name="plus" size={15} />Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Profile Settings ─── */
const ProfilePage = ({ user }: { user: AppUser }) => {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: '', dept: user.dept });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [faceUploading, setFaceUploading] = useState(false);
  const [faceUploaded, setFaceUploaded] = useState(false);
  const [notifs, setNotifs] = useState({ email: true, sms: false, daily: true, weekly: true, failures: true });
  const toast = useToast();

  const saveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.add('Profile updated successfully', 'success');
  };

  const changePw = async () => {
    if (!pwForm.current || !pwForm.newPw) { toast.add('Please fill in all password fields', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.add('Passwords do not match', 'error'); return; }
    if (pwForm.newPw.length < 8) { toast.add('Password must be at least 8 characters', 'error'); return; }
    setSaving(true);
    try {
      await updatePassword({ oldPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      toast.add('Password changed successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password change failed.';
      toast.add(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceUploading(true);
    try {
      const key = await attendanceService.uploadFaceImage(file, user.username);
      setFaceUploaded(true);
      toast.add(`Face image uploaded to S3: ${key}`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      toast.add(message, 'error');
    } finally {
      setFaceUploading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="card mb-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Avatar initials={user.initials} size={72} color="accent" />
            <label style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-card)' }}>
              <Icon name="camera" size={11} color="#0a0f1e" />
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={() => toast.add('Profile photo updated', 'success')} />
            </label>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              Cognito ID: {user.username}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                {user.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
              <span className="badge badge-green"><span className="dot dot-green" />Session Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Face Upload Section (S3 → Rekognition) ─── */}
      <div className="card mb-4">
        <div className="font-semibold mb-1" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="face" size={18} color="var(--accent)" />Register Face for Recognition
        </div>
        <div className="text-xs text-muted mb-4">
          Upload a clear front-facing photo. This will be stored in S3 under <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>faces/{user.username}/</span> and indexed by AWS Rekognition.
        </div>
        <label style={{ display: 'inline-block', cursor: 'pointer' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            background: faceUploaded ? 'var(--green-dim)' : 'var(--bg-secondary)',
            border: `1.5px dashed ${faceUploaded ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 10, transition: 'all .2s',
          }}>
            {faceUploading
              ? <Spinner size={20} />
              : faceUploaded
                ? <Icon name="check_circle" size={20} color="var(--green)" />
                : <Icon name="upload" size={20} color="var(--accent)" />}
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: faceUploaded ? 'var(--green)' : 'var(--text)' }}>
                {faceUploading ? 'Uploading to S3…' : faceUploaded ? 'Face image uploaded successfully' : 'Upload face photo for Rekognition'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                JPG or PNG · Well-lit, front-facing · No sunglasses
              </div>
            </div>
          </div>
          {/* capture="user" for mobile front-camera access */}
          <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFaceUpload} disabled={faceUploading} />
        </label>
        {faceUploaded && (
          <div style={{ marginTop: 10 }}>
            <span className="text-xs text-muted" style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => setFaceUploaded(false)}>Upload a different photo</span>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <div className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="user" size={18} color="var(--accent)" />Personal Information
        </div>
        <div className="grid-2 grid" style={{ gap: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={form.email} readOnly style={{ opacity: .7, cursor: 'not-allowed' }} title="Email is managed by Cognito" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Department</label>
            <select className="form-input" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
              {['Engineering', 'Design', 'Marketing', 'HR', 'Finance'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary mt-4" onClick={saveProfile} disabled={saving}>
          {saving ? <><Spinner size={15} />Saving…</> : <><Icon name="check" size={15} />Save Changes</>}
        </button>
      </div>

      <div className="card mb-4">
        <div className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="lock" size={18} color="var(--accent2)" />Change Password
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { l: 'Current Password', k: 'current' as const, p: '••••••••' },
            { l: 'New Password', k: 'newPw' as const, p: 'Min 8 characters' },
            { l: 'Confirm New Password', k: 'confirm' as const, p: 'Repeat new password' },
          ].map((f) => (
            <div key={f.k} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{f.l}</label>
              <input className="form-input" type="password" placeholder={f.p}
                value={pwForm[f.k]} onChange={(e) => setPwForm({ ...pwForm, [f.k]: e.target.value })} />
            </div>
          ))}
        </div>
        <button className="btn btn-outline mt-4" onClick={changePw} disabled={saving}>
          <Icon name="lock" size={15} />Update Password
        </button>
      </div>

      <div className="card">
        <div className="font-semibold mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="bell" size={18} color="var(--amber)" />Notification Preferences
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { k: 'email' as const, l: 'Email Notifications', d: 'Receive attendance summaries via email' },
            { k: 'sms' as const, l: 'SMS Alerts', d: 'Get SMS for missed attendance' },
            { k: 'daily' as const, l: 'Daily Digest', d: 'Daily attendance report at 6 PM' },
            { k: 'weekly' as const, l: 'Weekly Summary', d: 'Weekly analytics report on Mondays' },
            { k: 'failures' as const, l: 'Recognition Failures', d: 'Alerts when face recognition fails' },
          ].map((n, i) => (
            <div key={n.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{n.l}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.d}</div>
              </div>
              <div style={{ position: 'relative', width: 42, height: 24, borderRadius: 12, background: notifs[n.k] ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}
                onClick={() => setNotifs((prev) => ({ ...prev, [n.k]: !prev[n.k] }))}>
                <div style={{ position: 'absolute', top: 2, left: notifs[n.k] ? 18 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }} />
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-outline mt-4" onClick={() => toast.add('Notification preferences saved', 'success')}>
          Save Preferences
        </button>
      </div>
    </div>
  );
};

/* ─── Loading Screen ─── */
const LoadingScreen = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 20 }}>
    <div style={{ width: 48, height: 48, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="scan" size={24} color="#0a0f1e" />
    </div>
    <Spinner size={28} />
    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Restoring Cognito session…</div>
  </div>
);

/* ══════════════════════════════════
   ROOT APP
══════════════════════════════════ */
const App = () => {
  const { user, loading, refresh } = useAuth();
  const [page, setPage] = useState<AppPage>('dashboard');
  const [theme, setTheme] = useState('dark');
  // Sidebar is open (not collapsed) by default on desktop; collapsed on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toast = useToast();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.add('Signed out successfully', 'info');
    } catch {
      // Force clear even if Cognito returns an error (e.g. network issue)
      toast.add('Signed out', 'info');
    } finally {
      refresh();
    }
  };

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <AuthPage onAuthenticated={() => { refresh(); }} />;
  }

  return (
    <AppContext.Provider value={{ theme, toggleTheme, user }}>
      <div className="app-layout">
        <Sidebar
          page={page}
          setPage={setPage}
          user={user}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Mobile-only backdrop — only shown when sidebar is open on small screens */}
        {!sidebarCollapsed && (
          <div
            className="mobile-overlay"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40 }}
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        <main className={`main-content ${sidebarCollapsed ? 'full' : ''}`}>
          <Topbar
            page={page}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            onMenuClick={() => setSidebarCollapsed(false)}
          />
          <div className="page-content">
            {page === 'dashboard' && <DashboardPage user={user} />}
            {page === 'mark' && <MarkAttendancePage user={user} />}
            {page === 'history' && <HistoryPage />}
            {page === 'admin' && <AdminPage />}
            {page === 'profile' && <ProfilePage user={user} />}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
};

/* ─── Entry Point ─── */
export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const styleId = 'smartattend-global-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  if (!mounted) return null;

  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
