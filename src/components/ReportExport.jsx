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
const PALETTE = ['#0d9488', '#7c3aed', '#ea580c', '#db2777', '#0284c7', '#16a34a', '#d97706', '#4f46e5'];

const ReportExport = ({ type, format: exportFormatProp = 'pdf', startDate: propStartDate, endDate: propEndDate, events, employees, onClose }) => {
  const reportRef = useRef(null);

  // Date range directly passed as Date objects
  const startDate = propStartDate;
  const endDate   = propEndDate;

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr   = format(endDate,   'yyyy-MM-dd');
  
  let periodStr = `Từ ${format(startDate, 'dd-MM-yyyy')} đến ${format(endDate, 'dd-MM-yyyy')}`;
  if (type === 'daily') {
    periodStr = `Ngày ${format(startDate, 'dd-MM-yyyy')}`;
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
  const todayStr       = format(new Date(), 'yyyy-MM-dd');
  const overdueTasks   = filteredEvents.filter(e => e.status === 'todo' && e.dueDate < todayStr).length;
  const completionRate = totalTasks > 0 ? ((doneTasks / totalTasks) * 100).toFixed(1) : 0;

  // Active employees (those with at least 1 task in period)
  const activeEmployees = employees.filter(e => e.id.startsWith('NVMKT') || e.id === 'PhucMKT');

  // Chart 1: Task count per employee (Bar)
  const empTaskCounts = activeEmployees.map(emp => ({
    name: getDisplayName(emp.id),
    id: emp.id,
    count: filteredEvents.filter(e => e.categoryId === emp.id).length,
  })).filter(x => x.count > 0);

  const chart1Data = {
    labels: empTaskCounts.map(x => x.name),
    datasets: [{
      label: 'Số công việc',
      data: empTaskCounts.map(x => x.count),
      backgroundColor: empTaskCounts.map((_, i) => PALETTE[i % PALETTE.length]),
      borderRadius: 6,
    }],
  };

  // Chart 2: Pie – overall done vs not done
  const chart2Data = {
    labels: ['Đã hoàn thành', 'Chưa xong'],
    datasets: [{
      data: [doneTasks, totalTasks - doneTasks],
      backgroundColor: ['#16a34a', '#ea580c'],
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
      label: 'Tỷ lệ hoàn thành (%)',
      data: empRates.map(x => x.rate),
      backgroundColor: empRates.map((_, i) => PALETTE[(i + 2) % PALETTE.length]),
      borderRadius: 6,
    }],
  };

  const getStatusText = (status) => {
    if (status === 'done') return 'Hoàn thành';
    if (status === 'in-progress') return 'Đang xử lý';
    return 'Chưa làm';
  };

  const getStatusColor = (status) => {
    if (status === 'done') return '#16a34a';
    if (status === 'in-progress') return '#2563eb';
    return '#ea580c';
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
        <title>Bao Cao MKT HN</title>
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
          th { border: 1px solid #ccc; padding: 8px 12px; background-color: #f1f5f9; font-weight: bold; text-align: center; }
          td { border: 1px solid #ccc; padding: 6px 12px; text-align: center; word-break: break-word; }
          .td-left { text-align: left; }
          h1 { text-align: center; color: #1e3a8a; font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
          h2 { text-align: center; color: #1e3a8a; font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .section-title { font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #1e3a8a; padding-bottom: 4px; color: #1e3a8a; }
          .chart-title { font-size: 13px; font-weight: bold; text-align: center; margin-top: 25px; margin-bottom: 10px; }
          .chart-sub { font-size: 11px; font-weight: normal; color: #555; }
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
    let typeName = 'Tuan';
    if (type === 'daily') typeName = 'Ngay';
    if (type === 'monthly') typeName = 'Thang';
    if (type === 'custom') typeName = 'TuyChinh';
    link.download = `BaoCao_${typeName}_MKT_HN_${format(startDate, 'dd-MM-yyyy')}.doc`;
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
    // A4-friendly dimensions (680px width) completely prevents horizontal clipping
    wrap:    { fontFamily: 'Arial, sans-serif', color: '#111', background: '#fff', padding: '20px', width: '680px', boxSizing: 'border-box' },
    header:  { textAlign: 'center', marginBottom: '24px' },
    h1:      { fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 6px' },
    h2:      { fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 6px' },
    sub:     { fontSize: '12px', color: '#555', margin: 0 },
    secTitle: { fontSize: '15px', fontWeight: 'bold', marginTop: '24px', marginBottom: '10px', borderBottom: '2px solid #1e3a8a', paddingBottom: '4px' },
    table:   { width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '16px', tableLayout: 'fixed' },
    th:      { border: '1px solid #ccc', padding: '7px 10px', background: '#f1f5f9', fontWeight: 'bold', textAlign: 'center' },
    td:      { border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'normal' },
    tdL:     { border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left', wordBreak: 'break-word', whiteSpace: 'normal' },
    chartTitle: { fontSize: '13px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0 8px' },
    chartSub:   { fontSize: '11px', fontWeight: 'normal', color: '#555' },
  };

  return (
    <div style={{ position: 'fixed', top: '-99999px', left: '-99999px', zIndex: -1 }}>
      <div ref={reportRef} style={S.wrap}>

        {/* Header */}
        <div style={S.header}>
          <h1 style={S.h1}>BÁO CÁO TỔNG HỢP CÔNG VIỆC</h1>
          <h2 style={S.h2}>BÁO CÁO {type === 'daily' ? 'NGÀY' : type === 'weekly' ? 'TUẦN' : type === 'monthly' ? 'THÁNG' : 'TÙY CHỈNH'} PHÒNG MKT HN</h2>
          <p style={S.sub}>{periodStr}</p>
        </div>

        {/* Section I */}
        <div style={S.secTitle}>I. TỔNG QUAN</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '70%' }}>Chỉ tiêu</th>
              <th style={{ ...S.th, width: '30%' }}>Giá trị</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={S.tdL}>Tổng số công việc</td><td style={S.td}>{totalTasks}</td></tr>
            <tr><td style={S.tdL}>Đã hoàn thành</td><td style={S.td}>{doneTasks}</td></tr>
            <tr><td style={S.tdL}>Đang xử lý (In-progress)</td><td style={S.td}>{inProgressTasks}</td></tr>
            <tr><td style={S.tdL}>Tỷ lệ hoàn thành</td><td style={S.td}>{completionRate}%</td></tr>
            <tr><td style={S.tdL}>Số công việc quá hạn</td><td style={S.td}>{overdueTasks}</td></tr>
          </tbody>
        </table>

        {/* Chart 1 */}
        {empTaskCounts.length > 0 && (
          <div style={{ pageBreakInside: 'avoid', marginBottom: '24px' }}>
            <div style={S.chartTitle}>
              Biểu đồ 1: Số lượng công việc của từng nhân viên
              <br /><span style={S.chartSub}>Số lượng công việc theo phòng ban – {type === 'daily' ? 'Ngày' : type === 'weekly' ? 'Tuần' : type === 'monthly' ? 'Tháng' : 'Tùy chỉnh'} {format(startDate, 'dd/MM/yyyy')}</span>
            </div>
            <div style={{ width: '100%', height: '260px' }}>
              <Bar
                data={chart1Data}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    datalabels: {
                      anchor: 'end',
                      align: 'end',
                      color: '#000',
                      font: { weight: 'bold' }
                    }
                  },
                  scales: { 
                    x: {
                      title: { display: true, text: 'Tên nhân viên', font: { weight: 'bold' } }
                    },
                    y: { 
                      beginAtZero: true, 
                      ticks: { stepSize: 1 },
                      title: { display: true, text: 'Số lượng công việc', font: { weight: 'bold' } }
                    } 
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Chart 2 */}
        {totalTasks > 0 && (
          <div style={{ pageBreakInside: 'avoid', marginBottom: '24px' }}>
            <div style={S.chartTitle}>
              Biểu đồ 2: Tỷ lệ hoàn thành tổng thể
              <br /><span style={S.chartSub}>Tỷ lệ hoàn thành Tổng thể – {type === 'daily' ? 'Ngày' : type === 'weekly' ? 'Tuần' : type === 'monthly' ? 'Tháng' : 'Tùy chỉnh'}</span>
            </div>
            <div style={{ width: '380px', height: '240px', margin: '0 auto' }}>
              <Pie 
                data={{
                  labels: [`Hoàn thành (${doneTasks})`, `Chưa hoàn thành (${totalTasks - doneTasks})`],
                  datasets: [{
                    data: [doneTasks, totalTasks - doneTasks],
                    backgroundColor: ['#16a34a', '#ea580c'],
                    borderWidth: 2,
                  }],
                }} 
                options={{ 
                  responsive: true, maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' },
                    datalabels: {
                      color: '#fff',
                      font: { weight: 'bold', size: 12 },
                      formatter: (value, ctx) => {
                        if (value === 0) return '';
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => { sum += data; });
                        let percentage = (value*100 / sum).toFixed(1)+"%";
                        return percentage;
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}

        {/* Chart 3 (Clean Page Break before Chart 3 prevents it from splitting in half) */}
        {empRates.length > 0 && (
          <div style={{ pageBreakBefore: 'always', marginTop: '20px' }}>
            <div style={S.chartTitle}>
              Biểu đồ 3: Tỷ lệ hoàn thành của từng nhân viên
              <br /><span style={S.chartSub}>Tỷ lệ hoàn thành theo phòng ban – {type === 'daily' ? 'Ngày' : type === 'weekly' ? 'Tuần' : type === 'monthly' ? 'Tháng' : 'Tùy chỉnh'}</span>
            </div>
            <div style={{ width: '100%', height: `${Math.max(220, empRates.length * 50)}px` }}>
              <Bar
                data={chart3Data}
                options={{
                  indexAxis: 'y',
                  responsive: true, maintainAspectRatio: false,
                  layout: { padding: { right: 40 } },
                  plugins: { 
                    legend: { display: false },
                    datalabels: {
                      anchor: 'end',
                      align: 'end',
                      color: '#000',
                      font: { weight: 'bold' },
                      formatter: (value) => `${value}%`
                    }
                  },
                  scales: { 
                    x: { 
                      beginAtZero: true, max: 100, 
                      ticks: { callback: (v) => `${v}%` },
                      title: { display: true, text: 'Tỷ lệ hoàn thành (%)', font: { weight: 'bold' } }
                    },
                    y: {
                      title: { display: true, text: 'Tên nhân viên', font: { weight: 'bold' } }
                    }
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Section II (Clean Page Break before detailed tables list) */}
        <div style={{ pageBreakBefore: 'always', marginTop: '20px' }} />
        <div style={S.secTitle}>II. CHI TIẾT CÔNG VIỆC</div>

        {activeEmployees.map(emp => {
          const tasks = filteredEvents.filter(e => e.categoryId === emp.id);
          if (!tasks.length) return null;
          return (
            <div key={emp.id} style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th colSpan="7" style={{ ...S.th, textAlign: 'left', background: '#dbeafe' }}>
                      Nhân viên: {getDisplayName(emp.id)}
                    </th>
                  </tr>
                  <tr>
                    <th style={{ ...S.th, width: '6%' }}>STT</th>
                    <th style={{ ...S.th, width: '18%' }}>Ngày</th>
                    <th style={{ ...S.th, width: '11%' }}>Thời gian</th>
                    <th style={{ ...S.th, width: '35%' }}>Nội dung công việc</th>
                    <th style={{ ...S.th, width: '10%' }}>Phân loại</th>
                    <th style={{ ...S.th, width: '12%' }}>Tình trạng</th>
                    <th style={{ ...S.th, width: '8%' }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => {
                    const yearStr = format(new Date(task.dueDate), 'yyyy');
                    const dateStr = task.endDate && task.endDate !== task.dueDate
                      ? `${format(new Date(task.dueDate), 'dd/MM')} - ${format(new Date(task.endDate), `dd/MM/${yearStr}`)}`
                      : format(new Date(task.dueDate), 'dd/MM/yyyy');
                    
                    const depts = (task.sendToDepartments || [])
                      .map(id => {
                        const stored = localStorage.getItem(`name_${id}`);
                        if (stored) return stored;
                        const found = employees.find(e => e.id === id);
                        return found ? found.name : id;
                      })
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <tr key={task.id}>
                        <td style={S.td}>{i + 1}</td>
                        <td style={S.td}>{dateStr}</td>
                        <td style={S.td}>{task.dueTime}</td>
                        <td style={S.tdL}>
                          <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                          {task.description && (
                            <div style={{ fontStyle: 'italic', marginTop: '4px', fontSize: '10px' }}>{task.description}</div>
                          )}
                        </td>
                        <td style={S.td}>{depts}</td>
                        <td style={{ ...S.td, color: getStatusColor(task.status), fontWeight: 'bold' }}>
                          {getStatusText(task.status)}
                        </td>
                        <td style={S.td}>–</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default ReportExport;
