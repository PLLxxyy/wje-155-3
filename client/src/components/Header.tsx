import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/search" className="header-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="14" rx="2" ry="2"/>
            <line x1="3" y1="17" x2="3" y2="21"/>
            <line x1="21" y1="17" x2="21" y2="21"/>
            <line x1="7" y1="21" x2="17" y2="21"/>
            <circle cx="7.5" cy="10.5" r="1.5"/>
            <circle cx="16.5" cy="10.5" r="1.5"/>
            <line x1="8" y1="7" x2="16" y2="7"/>
          </svg>
          城市公交查询
        </Link>
        <nav className="header-nav">
          <Link to="/search" className={isActive('/search')}>搜索</Link>
          {user && <Link to="/profile" className={isActive('/profile')}>个人中心</Link>}
          {isAdmin && <Link to="/admin" className={isActive('/admin')}>管理后台</Link>}
        </nav>
      </div>
      <div className="header-right">
        {user ? (
          <>
            <span className="header-user">
              {user.role === 'admin' ? '管理员' : '用户'}：{user.username}
            </span>
            <button className="header-nav" onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>退出</span>
            </button>
          </>
        ) : (
          <Link to="/login" className="header-nav" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: 14, padding: '6px 14px' }}>
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
