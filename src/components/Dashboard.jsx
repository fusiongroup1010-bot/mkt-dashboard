import React from 'react';
import { Sparkles, Calendar, Clock, CheckCircle, ArrowRight, AlertTriangle, Users, FileText, Tag, Sun, Sunset, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEvents, CATEGORY_MAP } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const today = () => new Date().toISOString().split('T')[0];

const TYPE_CONFIG = {
  meeting: { label: 'Meeting', icon: Users,    color: '#7c3aed', bg: '#f3e8ff' },
  task:    { label: 'Task',    icon: Tag,      color: '#0891b2', bg: '#e0f2fe' },
  report:  { label: 'Report',  icon: FileText, color: '#d97706', bg: '#fef3c7' },
};

const formatDate = (d, end) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const startStr = format(dt, 'EEE, MMM d', { locale: enUS });
  if (!end || end === d) {
    const diff = Math.ceil((dt - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue (${startStr})`;
    return startStr;
  }
  const dtEnd = new Date(end + 'T00:00:00');
  return `${startStr} - ${format(dtEnd, 'MMM d', { locale: enUS })}`;
};

const Dashboard = () => {
  const { filteredItems: items, updateEvent, deleteEvent, openEditModal, activeLocation } = useEvents();
  const { currentUser } = useAuth();
  const tday = today();

  // Simplified banner config
  const locBanner = { bannerBg: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)', textColor: '#1e3a8a' };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const { bannerBg, textColor } = locBanner;
    if (hour >= 6 && hour < 12)  return { text: 'Good morning',  icon: Sun,      bannerBg, iconColor: textColor, accent: '#f59e0b', animate: 'sun-rotate'   };
    if (hour >= 12 && hour < 18) return { text: 'Good afternoon', icon: Sunset,   bannerBg, iconColor: textColor, accent: '#f97316', animate: 'sunset-float' };
    if (hour >= 18 && hour < 23) return { text: 'Good evening',   icon: Moon,     bannerBg, iconColor: textColor, accent: '#fcd34d', animate: 'sunset-float' };
    return                              { text: 'Good night',     icon: Sparkles, bannerBg, iconColor: textColor, accent: '#fcd34d', animate: 'sunset-float' };
  };

  const greet = getGreeting();
  const GreetIcon = greet.icon;
  const userName = currentUser?.name || 'CEO';

  // Date Range Filter (Default: Current Month)
  const [startDate, setStartDate] = React.useState(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = React.useState(() => {
    const d = new Date();
    return format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
  });

  /* ── Stats based on Range ── */
  const itemsInRange = items.filter(t => t.dueDate >= startDate && t.dueDate <= endDate);

  // Stats logic: mutually exclusive buckets based on status
  // To-do  = status is 'todo' (or no status assigned) and NOT overdue
  // In Progress = status is 'in-progress' (stays here regardless of deadline)
  // Overdue = status is 'todo' (or none) AND past deadline
  // Completed = status is 'done'
  const completed  = itemsInRange.filter(t => t.status === 'done');
  const inProgress = itemsInRange.filter(t => t.status === 'in-progress');
  const overdue    = itemsInRange.filter(t => {
    // Only 'todo' (or unset) tasks can be overdue; in-progress and done are excluded
    if (t.status === 'done' || t.status === 'in-progress') return false;
    const due = new Date(`${t.dueDate}${t.dueTime ? 'T' + t.dueTime : 'T23:59'}`);
    return due < new Date();
  });
  // To-do = todo/unset status that are NOT yet overdue
  const dueInRange = itemsInRange.filter(t => {
    if (t.status === 'done' || t.status === 'in-progress') return false;
    const due = new Date(`${t.dueDate}${t.dueTime ? 'T' + t.dueTime : 'T23:59'}`);
    return due >= new Date(); // only future/current deadlines
  });

  // Day filter state
  const [selectedDay, setSelectedDay] = React.useState('');
  // KPI expand state
  const [selectedKpi, setSelectedKpi] = React.useState(null);
  // Context Menu for right-click deleting
  const [contextMenu, setContextMenu] = React.useState(null);

  React.useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  /* ── Schedule in Range ── */
  const scheduleItems = itemsInRange
    .filter(t => {
      if (selectedDay) {
        // When a day is selected: show items whose deadline range includes that day
        const d1 = t.dueDate;
        const d2 = t.endDate || t.dueDate;
        return selectedDay >= d1 && selectedDay <= d2;
      }
      return t.status !== 'done';
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));

  /* ── Upcoming deadlines (next 7 days from NOW, independent of range to keep visibility) ── */
  const upcoming = items
    .filter(t => t.status !== 'done' && t.dueDate > tday)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  /* ── Color for each category ── */
  const getCatColor = (catId) => CATEGORY_MAP[catId]?.accent || '#888';

  const todayFormatted = format(new Date(), 'EEEE, MMMM d', { locale: enUS });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Greeting banner */}
      <div className="soft-panel animate-fade-in" style={{
        background: greet.bannerBg,
        padding: '32px', borderRadius: 'var(--radius-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: greet.iconColor, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {greet.text}, {userName}!
          </h1>
          {/* Brand Showcase - replaces Current Sheet label */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '30px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {/* SAY ALo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>SAY</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#cc1515', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', lineHeight: 1 }}>
                AL<span style={{ fontStyle: 'italic' }}>O</span>
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#cc1515', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#cc1515', letterSpacing: '0.4px', fontStyle: 'italic', marginTop: '3px', opacity: 0.85 }}>Taste the difference</span>
            </div>

            {/* HOW Today's */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>HOW</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#d4880a', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', lineHeight: 1 }}>
                Today<span style={{ color: '#d4880a' }}>'</span>s
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#d4880a', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#d4880a', letterSpacing: '0.4px', fontStyle: 'italic', marginTop: '3px', opacity: 0.85 }}>Designed for Pets</span>
            </div>

            {/* FEEL FINE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>FEEL</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#2e7d32', fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '1px', lineHeight: 1 }}>
                FINE
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#2e7d32', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#2e7d32', letterSpacing: '0.4px', fontStyle: 'italic', marginTop: '3px', opacity: 0.85 }}>From Nature</span>
            </div>

            {/* AND Merci — PURE TASTE over 'erci' */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>AND</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#e07b18', fontFamily: 'Georgia, serif', letterSpacing: '0.5px', lineHeight: 1, marginTop: '5px' }}>
                M
                <span style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', bottom: '100%', left: 0, fontSize: '6px', fontWeight: '700', color: '#e07b18', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '2px', opacity: 0.85 }}>PURE TASTE</span>
                  erci
                </span>
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#e07b18', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
            </div>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', marginTop: '0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span>Range:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontWeight: '700', color: 'var(--text-primary)' }} />
            <span> - </span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontWeight: '700', color: 'var(--text-primary)' }} />
            <span style={{ margin: '0 4px' }}>·</span>
            <span>{dueInRange.length > 0 ? `${dueInRange.length} item${dueInRange.length>1?'s':''} pending` : 'No tasks pending'}</span>
            {overdue.length > 0 && (
              <>
                <span style={{ margin: '0 4px' }}>·</span>
                <span style={{ color: 'var(--pink-accent)' }}>{overdue.length} overdue</span>
              </>
            )}
          </div>
        </div>
        <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', backdropFilter: 'blur(4px)' }}>
          <div className={greet.animate}>
            <GreetIcon size={64} color={greet.accent} strokeWidth={1.5} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
        {[
          { key: 'pending',    label: 'To-do', items: dueInRange,  sub: 'tasks/meetings', icon: Clock,         accentColor: '#e11d48', bgColor: '#ffe4e6' },
          { key: 'inprogress', label: 'In Progress',      items: inProgress,  sub: 'ongoing',        icon: ArrowRight,    accentColor: '#0284c7', bgColor: '#e0f2fe' },
          { key: 'completed',  label: 'Completed',        items: completed,   sub: 'total done',     icon: CheckCircle,   accentColor: '#16a34a', bgColor: '#dcfce7' },
          { key: 'overdue',    label: 'Overdue',          items: overdue,     sub: 'need attention', icon: AlertTriangle, accentColor: '#e11d48', bgColor: '#ffe4e6' },
        ].map(({ key, label, items: kpiItems, sub, icon: Icon, accentColor, bgColor }) => {
          const isActive = selectedKpi === key;
          return (
            <div
              key={key}
              onClick={() => setSelectedKpi(isActive ? null : key)}
              className="soft-panel kpi-card"
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                border: isActive ? `2px solid ${accentColor}` : '1px solid var(--border-light)',
                background: isActive ? `${accentColor}08` : 'var(--bg-panel)',
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
                <Icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: isActive ? accentColor : 'var(--text-primary)' }}>
                  {kpiItems.length} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{sub}</span>
                </h2>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Expanded List */}
      {selectedKpi && (() => {
        const kpiMap = {
          pending:    { label: 'To-do', items: dueInRange,  accentColor: '#e11d48' },
          inprogress: { label: 'In Progress',      items: inProgress,  accentColor: '#0284c7' },
          completed:  { label: 'Completed',        items: completed,   accentColor: '#16a34a' },
          overdue:    { label: 'Overdue',          items: overdue,     accentColor: '#e11d48' },
        };
        const { label, items: listItems, accentColor } = kpiMap[selectedKpi];
        return (
          <div className="soft-panel animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderTop: `3px solid ${accentColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: accentColor }}>{label} — {listItems.length} item{listItems.length !== 1 ? 's' : ''}</h3>
              <button onClick={() => setSelectedKpi(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>
            {listItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>No items in this category.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {listItems.map((item, idx) => {
                  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                  const TypeIcon = typeCfg.icon;
                  const catColor = getCatColor(item.categoryId);
                  const dateStr = item.dueDate ? format(new Date(item.dueDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: enUS }) : '';
                  const STATUS_COLORS = { todo: '#6b7280', 'in-progress': '#0284c7', done: '#16a34a' };
                  const statusLabel = item.status === 'in-progress' ? 'In Progress' : item.status === 'done' ? 'Done' : 'To Do';
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: `4px solid ${catColor}` }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-muted)', minWidth: '20px' }}>{idx + 1}.</span>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', background: typeCfg.color, borderRadius: '6px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        <TypeIcon size={10} /> {typeCfg.label}
                      </span>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{item.title}</span>
                        {item.description && (
                          <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-word' }}>
                            {item.description}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', flexShrink: 0 }}>{CATEGORY_MAP[item.categoryId]?.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', flexShrink: 0 }}>{dateStr}{item.dueTime ? ` · ${item.dueTime}` : ''}</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '8px', background: STATUS_COLORS[item.status] || '#6b7280', color: '#fff', flexShrink: 0 }}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Today's tasks + Upcoming timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
        
        {/* Schedule in Range */}
        <div className="soft-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Schedule (Selected Range)</h3>
            <Link to="/tasks" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: 'auto', padding: '6px 12px', color: 'var(--primary-accent)', fontSize: '13px' }}>
                View Board <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          {/* Day filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 14px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <Calendar size={14} color="var(--primary-accent)" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Filter by day:</span>
            <input
              type="date"
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-light)', fontFamily: 'inherit', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}
            />
            {selectedDay && (
              <button
                onClick={() => setSelectedDay('')}
                style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
              >
                Clear
              </button>
            )}
          </div>

          {scheduleItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
              🎉 Nothing scheduled in this range!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {scheduleItems.map(item => {
                const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                const catColor = getCatColor(item.categoryId);
                const TypeIcon = typeCfg.icon;
                const timeStr = (() => {
                  if (!item.dueTime) return 'All day';
                  if (!item.duration) return item.dueTime;
                  const [h, m] = item.dueTime.split(':').map(Number);
                  const endNum = (h + m / 60) + item.duration;
                  const h2 = Math.floor(endNum) % 24;
                  const m2 = Math.round((endNum - Math.floor(endNum)) * 60);
                  return `${item.dueTime} - ${h2.toString().padStart(2,'0')}:${m2.toString().padStart(2,'0')}`;
                })();
                // Format the date displayed next to time
                const dateStr = item.dueDate
                  ? format(new Date(item.dueDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: enUS })
                  : '';
                return (
                  <div
                    key={item.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'var(--bg-panel-hover)', borderRadius: 'var(--radius-md)', transition: 'background 0.15s', cursor: 'context-menu' }}
                  >
                    <div style={{ width: '10px', height: '44px', background: catColor, borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', background: typeCfg.color, borderRadius: '6px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <TypeIcon size={10} /> {typeCfg.label}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>
                          {formatDate(item.dueDate, item.endDate)} · {CATEGORY_MAP[item.categoryId]?.name}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>{item.title}</h4>
                      {item.description && (
                        <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    {/* Time + Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', background: 'var(--bg-panel)', padding: '4px 10px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-soft)' }}>
                        {timeStr}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>{dateStr}</div>
                    </div>
                    {/* Status Toggle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => updateEvent({ ...item, status: 'in-progress' })}
                        style={{
                          fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: item.status === 'in-progress' ? '#0284c7' : 'var(--bg-main)',
                          color: item.status === 'in-progress' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s'
                        }}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => updateEvent({ ...item, status: 'done' })}
                        style={{
                          fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                          background: item.status === 'done' ? '#16a34a' : 'var(--bg-main)',
                          color: item.status === 'done' ? '#ffffff' : 'var(--text-muted)',
                          transition: 'all 0.15s'
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming timeline */}
        <div className="soft-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Upcoming</h3>
            <Link to="/calendar" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: 'auto', padding: '6px 12px', color: 'var(--blue-accent)', fontSize: '13px' }}>
                Calendar <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>Nothing upcoming 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '16px', width: '2px', background: 'var(--border-light)', zIndex: 0 }} />
              {upcoming.map(item => {
                const catColor = getCatColor(item.categoryId);
                const isOv = item.dueDate < tday;
                return (
                  <div
                    key={item.id}
                    onClick={() => openEditModal(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
                    }}
                    style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1, cursor: 'pointer' }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isOv ? '#fee2e2' : `${catColor}20`, border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOv ? '#ef4444' : catColor }} />
                    </div>
                    <div style={{ paddingTop: '6px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>{item.title}</h4>
                      {item.description && (
                        <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '3px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {item.description}
                        </p>
                      )}
                      <p style={{ fontSize: '11px', fontWeight: '600', color: isOv ? '#ef4444' : 'var(--text-secondary)' }}>
                        {formatDate(item.dueDate, item.endDate)}{item.dueTime ? ` · ${item.dueTime}` : ''} · {CATEGORY_MAP[item.categoryId]?.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.5 }}>
        v1.1 (Updated: Wrapping Fix)
      </div>

      {contextMenu && (
        <div style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '6px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '140px',
        }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
                deleteEvent(contextMenu.itemId);
              }
              setContextMenu(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 12px',
              background: 'none',
              border: 'none',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--pink-accent)',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--pink-pastel)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <AlertTriangle size={14} /> Xóa công việc
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
