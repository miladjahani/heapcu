import React, { useState, useEffect } from 'react';
import { FaFileExcel, FaQuestionCircle, FaCalculator, FaFlask, FaIndustry, FaChartBar, FaWater, FaBolt } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './App.css'; // Don't forget to import the CSS file

// =================================================================================
// CSS Styles (Included here for completeness, but better in App.css)
// =================================================================================
const styles = {
  body: {
    fontFamily: "'Vazirmatn', sans-serif",
    direction: 'rtl',
    backgroundColor: '#eef2f7',
    color: '#333',
    margin: 0,
    padding: '20px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 80, 150, 0.1)',
    overflow: 'hidden',
  },
  mainHeader: {
    textAlign: 'center',
    padding: '25px',
    backgroundColor: '#0d47a1',
    color: 'white',
    fontSize: '26px',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    padding: '0 10px',
  },
  tabButton: {
    padding: '14px 20px',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    fontWeight: 500,
    color: '#495057',
    transition: 'all 0.2s ease-in-out',
    borderBottom: '3px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tabButtonActive: {
    color: '#0d47a1',
    borderBottomColor: '#0d47a1',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: '30px',
    minHeight: '400px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '25px',
    marginBottom: '25px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e8e8e8',
  },
  cardTitle: {
    color: '#0d47a1',
    marginTop: 0,
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  inputGroup: {
    marginBottom: '18px',
  },
  inputLabel: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  unit: {
    fontWeight: 'normal',
    color: '#888',
    fontSize: '13px',
    marginRight: '5px',
  },
  outputGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f7f9fc',
    borderRadius: '8px',
    border: '1px solid #e3eaf3',
    marginBottom: '12px',
  },
  outputLabel: {
    fontWeight: '500',
    color: '#333',
  },
  outputValue: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#0d47a1',
    backgroundColor: '#eaf2f8',
    padding: '5px 12px',
    borderRadius: '5px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
  },
  exportButton: {
    padding: '12px 25px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#1d6f42',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px',
  },
  helpTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px'
  },
  helpTh: {
      backgroundColor: '#0d47a1',
      color: 'white',
      padding: '12px',
      textAlign: 'right',
      border: '1px solid #ddd'
  },
  helpTd: {
      padding: '12px',
      border: '1px solid #ddd',
  }
};


// =================================================================================
// Helper Components
// =================================================================================
const Input = ({ id, label, unit, value, onChange, type = 'number' }) => (
  <div style={styles.inputGroup}>
    <label htmlFor={id} style={styles.inputLabel}>{label} <span style={styles.unit}>({unit})</span></label>
    <input id={id} type={type} value={value} onChange={e => onChange(id, e.target.value)} style={styles.input} step="0.01" />
  </div>
);

const Output = ({ label, value, unit }) => (
  <div style={styles.outputGroup}>
    <span style={styles.outputLabel}>{label}:</span>
    <span style={styles.outputValue}>{value} {unit}</span>
  </div>
);

const Card = ({ title, icon, children }) => (
  <div style={styles.card}>
    <h2 style={styles.cardTitle}>{icon} {title}</h2>
    {children}
  </div>
);

// =================================================================================
// Tab Components
// =================================================================================
const SummaryTab = ({ values, onExport }) => (
    <div style={styles.grid}>
        <Card title="نتایج کلیدی طراحی" icon={<FaChartBar />}>
            <Output label="سطح کل پد لیچینگ" value={values.padArea?.toFixed(0) || 0} unit="m²" />
            <Output label="حجم کل هیپ" value={values.totalVolume?.toFixed(0) || 0} unit="m³" />
            <Output label="زمان چرخه لیچینگ" value={values.leachCycleTime?.toFixed(1) || 0} unit="روز" />
            <Output label="نرخ تولید ساعتی کاتد" value={values.P_hr?.toFixed(3) || 0} unit="تن/ساعت" />
        </Card>
        <Card title="خلاصه جریان‌ها" icon={<FaWater />}>
            <Output label="دبی PLS" value={values.Q_PLS?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی رافینیت نهایی" value={values.Q12?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی فاز آلی" value={values.Q5?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی الکترولیت" value={values.Q8?.toFixed(2) || 0} unit="m³/h" />
        </Card>
        <div>
            <button onClick={onExport} style={styles.exportButton}><FaFileExcel /> دریافت خروجی اکسل</button>
        </div>
    </div>
);

const InputsTab = ({ values, onChange }) => (
    <Card title="پارامترهای اصلی و عملیاتی" icon={<FaCalculator />}>
        <Input id="P" label="تولید سالانه کاتد" unit="تن" value={values.P} onChange={onChange} />
        <Input id="wd" label="روز کاری در سال" unit="روز" value={values.wd} onChange={onChange} />
        <Input id="wh" label="ساعت کاری روزانه" unit="ساعت" value={values.wh} onChange={onChange} />
        <Input id="R" label="بازیابی کلی استخراج" unit="%" value={values.R} onChange={onChange} />
        <Input id="C_PLS_test" label="غلظت مس PLS (تست)" unit="g/L" value={values.C_PLS_test} onChange={onChange} />
        <Input id="Mh_ore" label="خوراک ساعتی سنگ" unit="ton/h" value={values.Mh_ore} onChange={onChange} />
    </Card>
);

const PadDesignTab = ({ values, onChange }) => (
    <div style={styles.grid}>
        <Card title="ورودی‌های طراحی پد" icon={<FaIndustry />}>
            <Input id="heapHeight" label="ارتفاع هیپ" unit="m" value={values.heapHeight} onChange={onChange} />
            <Input id="oreDensity" label="چگالی توده سنگ" unit="ton/m³" value={values.oreDensity} onChange={onChange} />
             <Input id="A_evap" label="ضریب تبخیر منطقه‌ای" unit="%" value={values.A_evap} onChange={onChange} />
        </Card>
        <Card title="نتایج طراحی پد" icon={<FaChartBar />}>
            <Output label="سطح کل پد" value={values.padArea?.toFixed(0) || 0} unit="m²" />
            <Output label="حجم کل هیپ" value={values.totalVolume?.toFixed(0) || 0} unit="m³" />
            <Output label="زمان چرخه لیچینگ" value={values.leachCycleTime?.toFixed(1) || 0} unit="روز" />
            <Output label="نرخ تبخیر از هیپ" value={values.E_heap?.toFixed(2) || 0} unit="m³/h" />
        </Card>
    </div>
);

const SXTab = ({ values, onChange }) => (
    <div style={styles.grid}>
        <Card title="ورودی‌های واحد استخراج" icon={<FaFlask />}>
            <Input id="OA_Ratio" label="نسبت فاز آبی به آلی (O:A)" unit="" value={values.OA_Ratio} onChange={onChange} />
        </Card>
        <Card title="نتایج واحد استخراج" icon={<FaChartBar />}>
            <Output label="دبی PLS به SX (Q₄)" value={values.Q4?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی فاز آلی باردار (Q₅)" value={values.Q5?.toFixed(2) || 0} unit="m³/h" />
            <Output label="غلظت مس فاز آلی (C₅)" value={values.C5?.toFixed(2) || 0} unit="g/L" />
            <Output label="دبی رافینیت به هیپ (Q₁₁)" value={values.Q11?.toFixed(2) || 0} unit="m³/h" />
            <Output label="غلظت مس رافینیت (C₁₁)" value={values.C11?.toFixed(2) || 0} unit="g/L" />
        </Card>
    </div>
);

const EWTab = ({ values, onChange }) => (
    <div style={styles.grid}>
        <Card title="ورودی‌های واحد الکترووینینگ" icon={<FaBolt />}>
            <Input id="Delta_Cu" label="اختلاف غلظت مس در EW" unit="g/L" value={values.Delta_Cu} onChange={onChange} />
        </Card>
        <Card title="نتایج واحد الکترووینینگ" icon={<FaChartBar />}>
            <Output label="دبی الکترولیت مصرفی (Q₈)" value={values.Q8?.toFixed(2) || 0} unit="m³/h" />
            <Output label="نرخ تولید ساعتی کاتد (P_hr)" value={values.P_hr?.toFixed(3) || 0} unit="تن/ساعت" />
        </Card>
    </div>
);

const AcidTab = ({ values, onChange }) => (
     <div style={styles.grid}>
        <Card title="ورودی‌های بالانس اسید" icon={<FaWater />}>
            <Input id="AcidConsumption" label="مصرف اسید" unit="kg/ton" value={values.AcidConsumption} onChange={onChange} />
            <Input id="AcidDensity" label="چگالی اسید" unit="ton/m³" value={values.AcidDensity} onChange={onChange} />
            <Input id="AggloAcidPercent" label="درصد اسید در آگلومراسیون" unit="%" value={values.AggloAcidPercent} onChange={onChange} />
            <Input id="Q9" label="دبی جریان Bleed" unit="m³/h" value={values.Q9} onChange={onChange} />
            <Input id="A_con9" label="غلظت اسید در Bleed" unit="g/L" value={values.A_con9} onChange={onChange} />
        </Card>
        <Card title="نتایج بالانس اسید" icon={<FaChartBar />}>
            <Output label="دبی اسید به رافینیت (Q₁₃)" value={values.Q13?.toFixed(4) || 0} unit="m³/h" />
            <Output label="دبی اسید به آگلومراسیون (Q₂₀)" value={values.Q20?.toFixed(4) || 0} unit="m³/h" />
            <Output label="دبی اسید به EW (از Bleed) (Q₁₄)" value={values.Q14?.toFixed(4) || 0} unit="m³/h" />
        </Card>
    </div>
);

const HelpTab = () => {
    const params = [
        { symbol: 'P', desc: 'کل کاتد مس تولیدی در طول یک سال', unit: 'تن' },
        { symbol: 'wd', desc: 'تعداد روزهای کاری کارخانه در یک سال', unit: 'روز' },
        { symbol: 'wh', desc: 'تعداد ساعات کاری کارخانه در یک روز', unit: 'ساعت' },
        { symbol: 'R', desc: 'درصد مس ورودی به هیپ که در نهایت به محلول PLS منتقل می‌شود', unit: '%' },
        { symbol: 'C_PLS_test', desc: 'غلظت مس در محلول باردار (PLS) که از تست‌های متالورژیکی به دست آمده', unit: 'g/L' },
        { symbol: 'Mh_ore', desc: 'میزان سنگ معدنی که در هر ساعت روی پد هیپ ریخته می‌شود', unit: 'ton/h' },
        { symbol: 'heapHeight', desc: 'ارتفاع عمودی پشته سنگ معدنی روی پد', unit: 'm' },
        { symbol: 'oreDensity', desc: 'چگالی توده‌ای (Bulk Density) سنگ معدنی خرد شده', unit: 'ton/m³' },
        { symbol: 'A_evap', desc: 'درصدی از جریان محلول که به دلیل شرایط آب و هوایی از سطح هیپ تبخیر می‌شود', unit: '%' },
        { symbol: 'AcidConsumption', desc: 'میزان اسید سولفوریک مصرفی به ازای هر تن سنگ معدنی برای انحلال مس', unit: 'kg/ton' },
        { symbol: 'OA_Ratio', desc: 'نسبت حجمی فاز آلی (Organic) به فاز آبی (Aqueous) در واحد استخراج', unit: '-' },
        { symbol: 'ΔCu', desc: 'اختلاف غلظت مس بین الکترولیت غنی (Rich) و مصرفی (Spent) در واحد الکترووینینگ', unit: 'g/L' },
    ];
    return (
        <Card title="راهنمای پارامترها و متغیرها" icon={<FaQuestionCircle />}>
            <table style={styles.helpTable}>
                <thead>
                    <tr>
                        <th style={styles.helpTh}>نماد</th>
                        <th style={styles.helpTh}>شرح پارامتر</th>
                        <th style={styles.helpTh}>واحد</th>
                    </tr>
                </thead>
                <tbody>
                    {params.map(p => (
                        <tr key={p.symbol}>
                            <td style={styles.helpTd}>{p.symbol}</td>
                            <td style={styles.helpTd}>{p.desc}</td>
                            <td style={styles.helpTd}>{p.unit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
};

// =================================================================================
// Main App Component
// =================================================================================
function App() {
  const [activeTab, setActiveTab] = useState('summary');
  const [values, setValues] = useState({
    // Main Inputs
    P: 10000, wd: 350, wh: 24, R: 85, C_PLS_test: 3.5, Mh_ore: 150,
    // Pad Design
    heapHeight: 6, oreDensity: 1.6,
    // Water Balance
    A_evap: 10,
    // Acid Balance
    AcidConsumption: 12, AcidDensity: 1.84, AggloAcidPercent: 25, Q9: 1, A_con9: 150,
    // SX Unit
    OA_Ratio: 1.2,
    // EW Unit
    Delta_Cu: 10,
    
    // Calculated Values
    // ... will be populated by useEffect
  });

  useEffect(() => {
    const v = { ...values };
    const getNum = (val) => parseFloat(val) || 0;

    // Inputs
    const P = getNum(v.P); const wd = getNum(v.wd); const wh = getNum(v.wh);
    const R_pct = getNum(v.R); const C_PLS_test = getNum(v.C_PLS_test); const Mh_ore = getNum(v.Mh_ore);
    const heapHeight = getNum(v.heapHeight); const oreDensity = getNum(v.oreDensity);
    const A_evap_pct = getNum(v.A_evap); const AcidConsumption = getNum(v.AcidConsumption);
    const AcidDensity = getNum(v.AcidDensity); const AggloAcidPercent_pct = getNum(v.AggloAcidPercent);
    const Q9 = getNum(v.Q9); const A_con9 = getNum(v.A_con9);
    const OA_Ratio = getNum(v.OA_Ratio); const Delta_Cu = getNum(v.Delta_Cu);

    // Conversions
    const R = R_pct / 100;
    const A_evap = A_evap_pct / 100;
    const AggloAcidPercent = AggloAcidPercent_pct / 100;

    let calc = {};

    // Core Calculations (based on dependencies)
    if (R > 0 && wd > 0 && wh > 0 && C_PLS_test > 0) {
      calc.Q_PLS = (P * 1000000) / (R * wd * wh * C_PLS_test);
    } else {
      calc.Q_PLS = 0;
    }
    
    calc.Q4 = calc.Q_PLS;
    calc.C4 = C_PLS_test;
    calc.Q11 = calc.Q4;
    calc.C11 = (1 - R) * calc.C4;
    calc.E_heap = A_evap * calc.Q11;
    calc.Q12 = calc.Q11 + calc.E_heap;
    if (calc.Q12 > 0) calc.C12 = (calc.Q11 * calc.C11) / calc.Q12; else calc.C12 = 0;
    
    // SX
    calc.Q5 = calc.Q4 * OA_Ratio;
    if (calc.Q5 > 0) calc.C5 = (R * calc.C4 * calc.Q4) / calc.Q5; else calc.C5 = 0;
    
    // EW
    if (wd > 0 && wh > 0 && Delta_Cu > 0) calc.Q8 = (P * 1000) / (wd * wh * Delta_Cu); else calc.Q8 = 0; // P is in tons, so * 1000 to get kg
    if (wd > 0 && wh > 0) calc.P_hr = P / (wd * wh); else calc.P_hr = 0;

    // Acid
    if (AcidDensity > 0) {
      calc.Q13 = (AcidConsumption * Mh_ore * (1 - AggloAcidPercent)) / (AcidDensity * 1000);
      calc.Q20 = (AcidConsumption * Mh_ore * AggloAcidPercent) / (AcidDensity * 1000);
      calc.Q14 = (Q9 * A_con9) / (1000 * AcidDensity);
    } else { calc.Q13 = 0; calc.Q20 = 0; calc.Q14 = 0; }
    
    // Pad Design
    const totalOreAnual = Mh_ore * wh * wd;
    if (oreDensity > 0) calc.totalVolume = totalOreAnual / oreDensity; else calc.totalVolume = 0;
    if (heapHeight > 0) calc.padArea = calc.totalVolume / heapHeight; else calc.padArea = 0;
    if (calc.Q_PLS > 0 && totalOreAnual > 0) calc.leachCycleTime = (totalOreAnual) / (Mh_ore * 24); else calc.leachCycleTime = 0;

    // Format results
    Object.keys(calc).forEach(key => {
        if(typeof calc[key] === 'number') {
            calc[key] = parseFloat(calc[key].toFixed(3));
        }
    });

    setValues(prev => ({ ...prev, ...calc }));
  }, [values]); // This will re-run on any change to the values object

  const handleInputChange = (id, value) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const handleExport = () => {
    const inputs = [
        { Parameter: 'تولید سالانه کاتد (P)', Value: values.P, Unit: 'تن' },
        { Parameter: 'روز کاری در سال (wd)', Value: values.wd, Unit: 'روز' },
        { Parameter: 'ساعت کاری روزانه (wh)', Value: values.wh, Unit: 'ساعت' },
        { Parameter: 'بازیابی کلی استخراج (R)', Value: values.R, Unit: '%' },
        { Parameter: 'غلظت مس PLS (تست)', Value: values.C_PLS_test, Unit: 'g/L' },
        { Parameter: 'خوراک ساعتی سنگ (Mh_ore)', Value: values.Mh_ore, Unit: 'ton/h' },
        { Parameter: 'ارتفاع هیپ', Value: values.heapHeight, Unit: 'm' },
        { Parameter: 'چگالی سنگ', Value: values.oreDensity, Unit: 'ton/m³' },
        { Parameter: 'ضریب تبخیر', Value: values.A_evap, Unit: '%' },
        { Parameter: 'مصرف اسید', Value: values.AcidConsumption, Unit: 'kg/ton' },
        { Parameter: 'چگالی اسید', Value: values.AcidDensity, Unit: 'ton/m³' },
        { Parameter: 'نسبت O:A', Value: values.OA_Ratio, Unit: '-' },
        { Parameter: 'اختلاف غلظت EW (ΔCu)', Value: values.Delta_Cu, Unit: 'g/L' },
    ];
    const outputs = [
        { Parameter: 'دبی PLS خروجی از هیپ (Q_PLS)', Value: values.Q_PLS, Unit: 'm³/h' },
        { Parameter: 'سطح پد لیچینگ', Value: values.padArea, Unit: 'm²' },
        { Parameter: 'زمان چرخه لیچینگ', Value: values.leachCycleTime, Unit: 'روز' },
        { Parameter: 'دبی فاز آلی باردار (Q₅)', Value: values.Q5, Unit: 'm³/h' },
        { Parameter: 'غلظت مس فاز آلی باردار (C₅)', Value: values.C5, Unit: 'g/L' },
        { Parameter: 'دبی الکترولیت مصرفی (Q₈)', Value: values.Q8, Unit: 'm³/h' },
        { Parameter: 'غلظت مس در رافینیت (C₁₁)', Value: values.C11, Unit: 'g/L' },
        { Parameter: 'نرخ تبخیر از هیپ (E_heap)', Value: values.E_heap, Unit: 'm³/h' },
        { Parameter: 'دبی اسید به رافینیت (Q₁₃)', Value: values.Q13, Unit: 'm³/h' },
        { Parameter: 'دبی اسید به آگلومراسیون (Q₂₀)', Value: values.Q20, Unit: 'm³/h' },
    ];
    
    const ws_inputs = XLSX.utils.json_to_sheet(inputs);
    const ws_outputs = XLSX.utils.json_to_sheet(outputs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws_inputs, "ورودی‌ها");
    XLSX.utils.book_append_sheet(wb, ws_outputs, "خروجی‌ها");
    XLSX.writeFile(wb, "HeapLeach_Calculation_Results.xlsx");
  };

  const tabs = [
    { id: 'summary', label: 'خلاصه نتایج', icon: <FaChartBar /> },
    { id: 'inputs', label: 'ورودی‌های اصلی', icon: <FaCalculator /> },
    { id: 'pad', label: 'طراحی پد', icon: <FaIndustry /> },
    { id: 'sx', label: 'واحد استخراج (SX)', icon: <FaFlask /> },
    { id: 'ew', label: 'واحد الکترووینینگ (EW)', icon: <FaBolt /> },
    { id: 'acid', label: 'بالانس اسید', icon: <FaWater /> },
    { id: 'help', label: 'راهنما', icon: <FaQuestionCircle /> },
  ];

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.mainHeader}><FaCalculator /> ماشین حساب صنعتی هیپ لیچینگ</h1>
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={{ ...styles.tabButton, ...(activeTab === tab.id ? styles.tabButtonActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div style={styles.tabContent}>
            {activeTab === 'summary' && <SummaryTab values={values} onExport={handleExport} />}
            {activeTab === 'inputs' && <InputsTab values={values} onChange={handleInputChange} />}
            {activeTab === 'pad' && <PadDesignTab values={values} onChange={handleInputChange} />}
            {activeTab === 'sx' && <SXTab values={values} onChange={handleInputChange} />}
            {activeTab === 'ew' && <EWTab values={values} onChange={handleInputChange} />}
            {activeTab === 'acid' && <AcidTab values={values} onChange={handleInputChange} />}
            {activeTab === 'help' && <HelpTab />}
        </div>
      </div>
    </div>
  );
}

export default App;
