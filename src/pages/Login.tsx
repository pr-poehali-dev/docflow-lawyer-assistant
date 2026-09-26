import { useState, FormEvent } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login, bootstrap, error, hasUsers, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isBootstrap = hasUsers === false;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    if (isBootstrap) {
      await bootstrap(name, email, password);
    } else {
      await login(email, password);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={28} className="text-electric animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-electric flex items-center justify-center glow-electric mb-4">
            <Icon name="ShieldCheck" size={30} className="text-background" />
          </div>
          <h1 className="text-xl font-bold text-foreground">ЛЕГИС ПРО</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isBootstrap ? "Создание первого администратора" : "Вход для сотрудников"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="surface border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
          {isBootstrap && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Ваше имя</label>
              <div className="relative">
                <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                autoFocus={!isBootstrap}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@legispro.ru"
                className="w-full pl-9 pr-3 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Пароль</label>
            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isBootstrap ? "Минимум 6 символов" : "Введите пароль"}
                className="w-full pl-9 pr-10 py-2.5 bg-surface-2 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-electric transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <Icon name={showPassword ? "EyeOff" : "Eye"} size={15} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <Icon name="AlertTriangle" size={13} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!email || !password || (isBootstrap && !name) || submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-electric text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon name={submitting ? "Loader2" : isBootstrap ? "UserPlus" : "LogIn"} size={16} className={submitting ? "animate-spin" : ""} />
            {submitting ? "Проверяем..." : isBootstrap ? "Создать администратора" : "Войти"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {isBootstrap
            ? "Вы станете администратором и сможете добавить остальных сотрудников"
            : "Доступ только для сотрудников компании «Легис Про»"}
        </p>
      </div>
    </div>
  );
}
