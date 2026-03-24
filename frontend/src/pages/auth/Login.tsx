import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 230, 118, ${(1 - dist / 100) * 0.2})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const response = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`¡Bienvenido, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Glow background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              boxShadow: '0 0 30px color-mix(in srgb, var(--accent) 15%, transparent)',
            }}
          >
            <img src="/logos/logo_iados.svg" alt="iados" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Core iados</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Plataforma CRM</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-surface)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Iniciar Sesión</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className={`input pl-9 ${errors.email ? 'border-red-500/50' : ''}`}
                  placeholder="admin@iados.mx"
                  {...register('email', { required: 'Email requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-9 pr-10 ${errors.password ? 'border-red-500/50' : ''}`}
                  placeholder="••••••••"
                  {...register('password', { required: 'Contraseña requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Ingresando...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          © 2024 iados.mx — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
