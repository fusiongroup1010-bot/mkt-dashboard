import React, { useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

// Saturated, bold premium palette (600-level, completely eliminating any blurry/fade-out look)
const PALETTE = ['#4f46e5', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#f97316', '#0ea5e9', '#ef4444'];

const whiteBackgroundPlugin = {
  id: 'whiteBackground',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

const ReportExport = ({ type, format: exportFormatProp = 'pdf', startDate: propStartDate, endDate: propEndDate, events, employees, onClose }) => {
  const reportRef = useRef(null);

  // Date range directly passed as Date objects
  const startDate = propStartDate;
  const endDate   = propEndDate;

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr   = format(endDate,   'yyyy-MM-dd');
  
  let periodStr = `From ${format(startDate, 'dd-MM-yyyy')} to ${format(endDate, 'dd-MM-yyyy')}`;
  if (type === 'daily') {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    periodStr = `${format(startDate, 'dd-MM-yyyy')} (${daysOfWeek[startDate.getDay()]})`;
  } else if (type === 'monthly') {
    periodStr = `${format(startDate, 'MM-yyyy')} (From ${format(startDate, 'dd-MM-yyyy')} to ${format(endDate, 'dd-MM-yyyy')})`;
  }

  // Filter tasks that overlap the period
  const filteredEvents = events.filter(e => {
    if (!e.dueDate) return false;
    const taskEnd = e.endDate || e.dueDate;
    return e.dueDate <= endStr && taskEnd >= startStr;
  });

  const getDisplayName = (id) => {
    const stored = localStorage.getItem(`name_${id}`);
    if (stored) return stored;
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : id;
  };

  // General metrics
  const totalTasks     = filteredEvents.length;
  const doneTasks      = filteredEvents.filter(e => e.status === 'done').length;
  const inProgressTasks = filteredEvents.filter(e => e.status === 'in-progress').length;
  const todoTasks       = filteredEvents.filter(e => e.status === 'todo').length;
  const todayStr       = format(new Date(), 'yyyy-MM-dd');
  const overdueTasks   = filteredEvents.filter(e => e.status === 'todo' && e.dueDate < todayStr).length;
  const completionRate = totalTasks > 0 ? ((doneTasks / totalTasks) * 100).toFixed(1) : 0;

  const campaignTasks = filteredEvents.filter(e => e.taskCategory === 'campaign');
  const activeCampaigns = campaignTasks.length;
  let totalCampaignProgress = 0;
  campaignTasks.forEach(c => {
    if (c.status === 'done') totalCampaignProgress += 100;
    else if (c.status === 'in-progress') totalCampaignProgress += (c.progress || 0);
  });
  const avgCampaignProgress = activeCampaigns > 0 ? (totalCampaignProgress / activeCampaigns).toFixed(1) : 0;

  // Active employees (those with at least 1 task in period)
  const activeEmployees = employees.filter(e => e.id.startsWith('NVMKT') || e.id === 'PhucMKT');

  const chartTitleSuffix = type === 'daily' ? `(${format(startDate, 'dd-MM-yyyy')})` : type === 'monthly' ? `(${format(startDate, 'MM-yyyy')})` : '';

  // Chart 1: Task count per employee (Bar)
  const empTaskCounts = activeEmployees.map(emp => ({
    name: getDisplayName(emp.id),
    id: emp.id,
    count: filteredEvents.filter(e => e.categoryId === emp.id).length,
  })).filter(x => x.count > 0);

  const chart1Data = {
    labels: empTaskCounts.map(x => x.name),
    datasets: [{
      label: 'Number of Tasks',
      data: empTaskCounts.map(x => x.count),
      backgroundColor: empTaskCounts.map((_, i) => PALETTE[i % PALETTE.length]),
      borderRadius: 4,
    }],
  };

  // Chart 2: Pie – overall done vs not done
  const chart2Data = {
    labels: ['Completed', 'In Progress', 'To Do'],
    datasets: [{
      data: [doneTasks, inProgressTasks, todoTasks],
      backgroundColor: ['#4ade80', '#fbbf24', '#e2e8f0'],
      borderWidth: 2,
    }],
  };

  // Chart 3: Horizontal bar – completion rate per employee
  const empRates = activeEmployees.map(emp => {
    const tasks = filteredEvents.filter(e => e.categoryId === emp.id);
    const done  = tasks.filter(e => e.status === 'done').length;
    return { name: getDisplayName(emp.id), id: emp.id, rate: tasks.length > 0 ? parseFloat(((done / tasks.length) * 100).toFixed(1)) : 0, total: tasks.length };
  }).filter(x => x.total > 0);

  const chart3Data = {
    labels: empRates.map(x => x.name),
    datasets: [{
      label: 'Completion Rate (%)',
      data: empRates.map(x => x.rate),
      backgroundColor: empRates.map((_, i) => '#60a5fa'),
      borderRadius: 4,
    }],
  };

  const getStatusText = (status) => {
    if (status === 'done') return 'Completed';
    if (status === 'in-progress') return 'In Progress';
    return 'To Do';
  };

  const exportToWord = () => {
    if (!reportRef.current) return;
    const clone = reportRef.current.cloneNode(true);
    const originalCanvases = reportRef.current.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    
    clonedCanvases.forEach((clonedCanvas, index) => {
      const originalCanvas = originalCanvases[index];
      if (originalCanvas) {
        try {
          const imgUrl = originalCanvas.toDataURL('image/png');
          const img = document.createElement('img');
          img.src = imgUrl;
          img.style.width = clonedCanvas.style.width || '100%';
          img.style.height = clonedCanvas.style.height || 'auto';
          img.style.display = 'block';
          img.style.margin = '0 auto';
          clonedCanvas.parentNode.replaceChild(img, clonedCanvas);
        } catch (e) {
          console.warn('Canvas conversion failed for Word export', e);
        }
      }
    });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>MKT HN Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
          th { border: 1px solid #000; padding: 6px 8px; background-color: #1e3a8a; color: #fff; font-weight: bold; text-align: center; }
          td { border: 1px solid #000; padding: 6px 8px; text-align: center; word-break: break-word; }
          .td-left { text-align: left; }
        </style>
      </head>
      <body>
        ${clone.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let typeName = 'Weekly';
    if (type === 'daily') typeName = 'Daily';
    if (type === 'monthly') typeName = 'Monthly';
    if (type === 'custom') typeName = 'Custom';
    link.download = `Report_${typeName}_MKT_HN_${format(startDate, 'dd-MM-yyyy')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!reportRef.current) return;
      try {
        exportToWord();
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        onClose?.();
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const S = {
    wrap:    { fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: '20px', width: '680px', boxSizing: 'border-box' },
    header:  { textAlign: 'center', marginBottom: '24px' },
    h1:      { fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 2px' },
    h2:      { fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '16px 0 6px' },
    sub:     { fontSize: '12px', color: '#333', margin: 0, fontStyle: 'italic' },
    secTitle: { fontSize: '14px', fontWeight: 'bold', marginTop: '24px', marginBottom: '10px', textTransform: 'uppercase' },
    secSubTitle: { fontSize: '13px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px', textTransform: 'uppercase' },
    table:   { width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '16px', tableLayout: 'fixed' },
    th:      { border: '1px solid #000', padding: '6px 8px', background: '#1e3a8a', color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    td:      { border: '1px solid #000', padding: '6px 8px', textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'normal', fontWeight: 'bold' },
    tdL:     { border: '1px solid #000', padding: '6px 8px', textAlign: 'left', wordBreak: 'break-word', whiteSpace: 'normal' },
    chartTitle: { fontSize: '13px', fontWeight: 'bold', textAlign: 'center', margin: '25px 0 10px', color: '#1e3a8a' },
  };

  const dailyTasks = filteredEvents.filter(e => e.taskCategory !== 'campaign');
  const campTasks = filteredEvents.filter(e => e.taskCategory === 'campaign');

  return (
    <div style={{ position: 'fixed', top: '-99999px', left: '-99999px', zIndex: -1 }}>
      <div ref={reportRef} style={S.wrap}>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.h1}>FUSION GROUP CO., LTD</h1>
          <h1 style={S.h1}>MARKETING DEPARTMENT (MKT)</h1>
          <h2 style={S.h2}>{type === 'daily' ? 'DAILY' : type === 'weekly' ? 'WEEKLY' : type === 'monthly' ? 'MONTHLY' : 'CUSTOM'} REPORT – MKT DEPARTMENT</h2>
          <p style={S.sub}>{periodStr}</p>
        </div>

        {/* Section I */}
        <div style={S.secTitle}>I. OVERVIEW</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '50%' }}>Metric</th>
              <th style={{ ...S.th, width: '50%' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={S.tdL}>Total tasks in the {type === 'daily' ? 'day' : type === 'weekly' ? 'week' : 'month'}</td><td style={S.td}>{totalTasks}</td></tr>
            <tr><td style={S.tdL}>Completed</td><td style={S.td}>{doneTasks}</td></tr>
            <tr><td style={S.tdL}>In Progress</td><td style={S.td}>{inProgressTasks}</td></tr>
            <tr><td style={S.tdL}>To Do / Not Started</td><td style={S.td}>{todoTasks}</td></tr>
            <tr><td style={S.tdL}>Overdue Tasks</td><td style={S.td}>{overdueTasks}</td></tr>
            <tr><td style={S.tdL}>Completion Rate (%)</td><td style={S.td}>{completionRate}%</td></tr>
            <tr><td style={S.tdL}>Active Campaigns</td><td style={S.td}>{activeCampaigns}</td></tr>
            <tr><td style={S.tdL}>Average Campaign Progress (%)</td><td style={S.td}>{avgCampaignProgress}%</td></tr>
          </tbody>
        </table>

        {/* Chart 1 */}
        <div style={{ pageBreakInside: 'avoid', marginBottom: '24px' }}>
          <div style={S.chartTitle}>Chart 1 - Number of Tasks by Employee {chartTitleSuffix}</div>
          <div style={{ width: '100%', height: '240px' }}>
            <Bar
              data={chart1Data}
              plugins={[whiteBackgroundPlugin]}
              options={{
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 25, left: 10, right: 10, bottom: 5 } },
                plugins: { 
                  legend: { display: false },
                  datalabels: { anchor: 'end', align: 'end', color: '#1e3a8a', font: { weight: 'bold' } }
                },
                scales: { 
                  x: { 
                    grid: { display: true, drawBorder: true, color: '#f1f5f9' },
                    ticks: { display: true }
                  },
                  y: { 
                    beginAtZero: true, 
                    suggestedMax: Math.max(...empTaskCounts.map(x => x.count), 0) + 1,
                    ticks: { stepSize: 0.25 },
                    grid: { display: true, drawBorder: true, color: '#f1f5f9' }
                  } 
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2 */}
        <div style={{ pageBreakInside: 'avoid', marginBottom: '24px' }}>
          <div style={S.chartTitle}>Chart 2 - Overall Completion Rate {chartTitleSuffix}</div>
          <div style={{ width: '300px', height: '200px', margin: '0 auto' }}>
            <Pie 
              data={chart2Data} 
              plugins={[whiteBackgroundPlugin]}
              options={{ 
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right', labels: { boxWidth: 12, padding: 10 } },
                  datalabels: {
                    color: '#111',
                    font: { weight: 'bold', size: 12 },
                    formatter: (value, ctx) => {
                      if (value === 0) return '';
                      let sum = 0;
                      let dataArr = ctx.chart.data.datasets[0].data;
                      dataArr.map(data => { sum += data; });
                      return ((value*100) / sum).toFixed(1) + "%";
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Chart 3 */}
        <div style={{ pageBreakBefore: 'always', marginTop: '20px' }}>
          <div style={S.chartTitle}>Chart 3 - Completion Rate by Employee {chartTitleSuffix}</div>
          <div style={{ width: '100%', height: `${Math.max(200, empRates.length * 40)}px` }}>
            <Bar
              data={chart3Data}
              plugins={[whiteBackgroundPlugin]}
              options={{
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { right: 40 } },
                plugins: { 
                  legend: { display: false },
                  datalabels: { anchor: 'end', align: 'end', color: '#000', font: { weight: 'bold' }, formatter: v => `${v}%` }
                },
                scales: { 
                  x: { beginAtZero: true, max: 100, ticks: { display: true }, grid: { display: true } },
                  y: { grid: { display: false } }
                },
              }}
            />
          </div>
        </div>

        {/* Section II */}
        <div style={{ pageBreakBefore: 'always', marginTop: '20px' }} />
        <div style={S.secTitle}>II. WORK DETAILS</div>
        
        <div style={{ marginBottom: '24px' }}>
          {activeEmployees.map((emp, empIndex) => {
            const empDailyTasks = dailyTasks.filter(e => e.categoryId === emp.id);
            const empCampTasks = campTasks.filter(e => e.categoryId === emp.id);
            
            if (empDailyTasks.length === 0 && empCampTasks.length === 0) return null;

            return (
              <div key={emp.id} style={{ marginBottom: '32px' }}>
                <div style={{ ...S.secSubTitle, color: '#1e3a8a', fontSize: '14px', borderBottom: '2px solid #1e3a8a', paddingBottom: '4px' }}>
                  {empIndex + 1}. Employee: {getDisplayName(emp.id)}
                </div>

                {empDailyTasks.length > 0 && (
                  <div style={{ marginTop: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#333' }}>- Daily Tasks</div>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={{ ...S.th, width: '6%' }}>No.</th>
                          <th style={{ ...S.th, width: '16%' }}>Date</th>
                          <th style={{ ...S.th, width: '16%' }}>Time</th>
                          <th style={{ ...S.th, width: '40%' }}>Task Content</th>
                          <th style={{ ...S.th, width: '14%' }}>Status</th>
                          <th style={{ ...S.th, width: '8%' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empDailyTasks.map((task, i) => (
                          <tr key={task.id}>
                            <td style={S.td}>{i + 1}</td>
                            <td style={S.td}>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</td>
                            <td style={S.td}>{task.dueTime}</td>
                            <td style={{ ...S.tdL, fontWeight: 'normal' }}>{task.title}</td>
                            <td style={{ ...S.td, color: '#111' }}>{getStatusText(task.status)}</td>
                            <td style={{ ...S.tdL, fontWeight: 'normal', textAlign: 'center' }}>-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {empCampTasks.length > 0 && (
                  <div style={{ marginTop: '12px', pageBreakInside: 'avoid' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#333' }}>- Campaign Tasks</div>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={{ ...S.th, width: '6%' }}>No.</th>
                          <th style={{ ...S.th, width: '20%' }}>Campaign Name</th>
                          <th style={{ ...S.th, width: '24%' }}>Objectives</th>
                          <th style={{ ...S.th, width: '18%' }}>Timeline</th>
                          <th style={{ ...S.th, width: '12%' }}>Progress (%)</th>
                          <th style={{ ...S.th, width: '12%' }}>Status</th>
                          <th style={{ ...S.th, width: '8%' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empCampTasks.map((task, i) => {
                          const progress = task.status === 'done' ? 100 : task.status === 'in-progress' ? (task.progress || 0) : 0;
                          const dateStr = task.endDate && task.endDate !== task.dueDate
                            ? `${format(new Date(task.dueDate), 'dd/MM/yyyy')} - \n${format(new Date(task.endDate), 'dd/MM/yyyy')}`
                            : format(new Date(task.dueDate), 'dd/MM/yyyy');
                          return (
                            <tr key={task.id}>
                              <td style={S.td}>{i + 1}</td>
                              <td style={{ ...S.tdL, fontWeight: 'normal' }}>{task.title}</td>
                              <td style={{ ...S.tdL, fontWeight: 'normal' }}>{task.description || '-'}</td>
                              <td style={{ ...S.td, whiteSpace: 'pre-wrap' }}>{dateStr}</td>
                              <td style={S.td}>{progress}%</td>
                              <td style={{ ...S.td, color: '#111' }}>{getStatusText(task.status)}</td>
                              <td style={{ ...S.tdL, fontWeight: 'normal', textAlign: 'center' }}>-</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ReportExport;
