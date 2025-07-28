import React, { useState } from 'react';
import { FaFileExcel, FaQuestionCircle, FaCalculator, FaFlask, FaIndustry, FaChartBar, FaWater, FaBolt, FaSyncAlt, FaPlayCircle } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './App.css'; 

// =================================================================================
// Styles Object (For simplicity, included in the component file)
// =================================================================================
const styles = {
  body: { fontFamily: "'Vazirmatn', sans-serif", direction: 'rtl', backgroundColor: '#eef2f7', color: '#333', margin: 0, padding: '20px' },
  container: { maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0, 80, 150, 0.1)', overflow: 'hidden' },
  mainHeader: { textAlign: 'center', padding: '25px', backgroundColor: '#0d47a1', color: 'white', fontSize: '26px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' },
  tabs: { display: 'flex', flexWrap: 'wrap', backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', padding: '0 10px' },
  tabButton: { padding: '14px 20px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', fontSize: '15px', fontWeight: 500, color: '#495057', transition: 'all 0.2s ease-in-out', borderBottom: '3px solid transparent', display: 'flex', alignItems: 'center', gap: '8px' },
  tabButtonActive: { color: '#0d47a1', borderBottomColor: '#0d47a1', fontWeight: 'bold' },
  tabContent: { padding: '30px', minHeight: '400px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', padding: '25px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', border: '1px solid #e8e8e8' },
  cardTitle: { color: '#0d47a1', marginTop: 0, marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #eee', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  inputGroup: { marginBottom: '18px' },
  inputLabel: { display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#555' },
  input: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' },
  unit: { fontWeight: 'normal', color: '#888', fontSize: '13px', marginRight: '5px' },
  outputGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f7f9fc', borderRadius: '8px', border: '1px solid #e3eaf3', marginBottom: '12px' },
  outputLabel: { fontWeight: '500', color: '#333' },
  outputValue: { fontWeight: 'bold', fontSize: '18px', color: '#0d47a1', backgroundColor: '#eaf2f8', padding: '5px 12px', borderRadius: '5px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' },
  buttonContainer: { display: 'flex', gap: '15px', marginTop: '20px' },
  actionButton: { flex: 1, padding: '12px 25px', fontSize: '16px', fontWeight: 'bold', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  calcButton: { backgroundColor: '#1d6f42' },
  resetButton: { backgroundColor: '#c82333' },
  exportButton: { backgroundColor: '#0069d9' },
  helpTable: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
  helpTh: { backgroundColor: '#0d47a1', color: 'white', padding: '12px', textAlign: 'right', border: '1px solid #ddd' },
  helpTd: { padding: '12px', border: '1px solid #ddd' }
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
const SummaryTab = ({ outputs, onCalculate, onReset, onExport }) => (
    <div style={styles.grid}>
        <Card title="نتایج کلیدی طراحی" icon={<FaChartBar />}>
            <Output label="سطح کل پد لیچینگ" value={outputs.padArea?.toFixed(0) || 0} unit="m²" />
            <Output label="حجم کل هیپ سالانه" value={outputs.totalVolume?.toFixed(0) || 0} unit="m³" />
            <Output label="زمان چرخه لیچینگ" value={outputs.leachCycleTime?.toFixed(1) || 0} unit="روز" />
            <Output label="نرخ تولید ساعتی کاتد" value={outputs.P_hr?.toFixed(3) || 0} unit="تن/ساعت" />
        </Card>
        <Card title="خلاصه جریان‌ها" icon={<FaWater />}>
            <Output label="دبی PLS" value={outputs.Q_PLS?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی رافینیت نهایی" value={outputs.Q12?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی فاز آلی" value={outputs.Q5?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی الکترولیت" value={outputs.Q8?.toFixed(2) || 0} unit="m³/h" />
        </Card>
        <Card title="عملیات" icon={<FaPlayCircle/>}>
            <p>پس از وارد کردن داده‌ها در تب‌های مختلف، محاسبات را از اینجا شروع کنید.</p>
            <div style={styles.buttonContainer}>
                 <button onClick={onCalculate} style={{...styles.actionButton, ...styles.calcButton}}><FaPlayCircle /> شروع محاسبات</button>
                 <button onClick={onReset} style={{...styles.actionButton, ...styles.resetButton}}><FaSyncAlt /> تنظیم مجدد</button>
            </div>
             <button onClick={onExport} style={{...styles.actionButton, ...styles.exportButton, width: '100%', marginTop: '15px'}}><FaFileExcel /> دریافت خروجی اکسل</button>
        </Card>
    </div>
);
const InputsTab = ({ inputs, onChange }) => (
    <Card title="پارامترهای اصلی و عملیاتی" icon={<FaCalculator />}>
        <Input id="P" label="تولید سالانه کاتد" unit="تن" value={inputs.P} onChange={onChange} />
        <Input id="wd" label="روز کاری در سال" unit="روز" value={inputs.wd} onChange={onChange} />
        <Input id="wh" label="ساعت کاری روزانه" unit="ساعت" value={inputs.wh} onChange={onChange} />
        <Input id="R" label="بازیابی کلی استخراج" unit="%" value={inputs.R} onChange={onChange} />
        <Input id="C_PLS_test" label="غلظت مس PLS (تست)" unit="g/L" value={inputs.C_PLS_test} onChange={onChange} />
        <Input id="Mh_ore" label="خوراک ساعتی سنگ" unit="ton/h" value={inputs.Mh_ore} onChange={onChange} />
    </Card>
);
const PadDesignTab = ({ inputs, outputs, onChange }) => (
    <div style={styles.grid}>
        <Card title="ورودی‌های طراحی پد" icon={<FaIndustry />}>
            <Input id="heapHeight" label="ارتفاع هیپ" unit="m" value={inputs.heapHeight} onChange={onChange} />
            <Input id="oreDensity" label="چگالی توده سنگ" unit="ton/m³" value={inputs.oreDensity} onChange={onChange} />
             <Input id="A_evap" label="ضریب تبخیر منطقه‌ای" unit="%" value={inputs.A_evap} onChange={onChange} />
        </Card>
        <Card title="نتایج طراحی پد" icon={<FaChartBar />}>
            <Output label="سطح کل پد" value={outputs.padArea?.toFixed(0) || 0} unit="m²" />
            <Output label="حجم کل هیپ سالانه" value={outputs.totalVolume?.toFixed(0) || 0} unit="m³" />
            <Output label="زمان چرخه لیچینگ" value={outputs.leachCycleTime?.toFixed(1) || 0} unit="روز" />
            <Output label="نرخ تبخیر از هیپ" value={outputs.E_heap?.toFixed(2) || 0} unit="m³/h" />
        </Card>
    </div>
);
const SXTab = ({ inputs, outputs, onChange }) => (
    <div style={styles.grid}>
        <Card title="ورودی‌های واحد استخراج" icon={<FaFlask />}>
            <Input id="OA_Ratio" label="نسبت فاز آبی به آلی (O:A)" unit="" value={inputs.OA_Ratio} onChange={onChange} />
        </Card>
        <Card title="نتایج واحد استخراج" icon={<FaChartBar />}>
            <Output label="دبی PLS به SX (Q₄)" value={outputs.Q4?.toFixed(2) || 0} unit="m³/h" />
            <Output label="دبی فاز آلی باردار (Q₅)" value={outputs.Q5?.toFixed(2) || 0} unit="m³/h" />
            <Output label="غلظت مس فاز آلی (C₅)" value={outputs.C5?.toFixed(2) || 0} unit="g/L" />
            <Output label="دبی رافینیت به هیپ (Q₁₁)" value={outputs.Q11?.toFixed(2) || 0} unit="m³/h" />
            <Output label="غلظت مس رافینیت (C₁₁)" value={outputs.C11?.toFixed(2) || 0} unit="g/L" />
        </Card>
    </div>
);
const EWTab = ({ inputs, outputs, onChange }) => (
    <div style={styles.grid}>
        <Card title="ورودی‌های واحد الکترووینینگ" icon={<FaBolt />}>
            <Input id="Delta_Cu" label="اختلاف غلظت مس در EW" unit="g/L" value={inputs.Delta_Cu} onChange={onChange} />
        </Card>
        <Card title="نتایج واحد الکترووینینگ" icon={<FaChartBar />}>
            <Output label="دبی الکترولیت مصرفی (Q₈)" value={outputs.Q8?.toFixed(2) || 0} unit="m³/h" />
            <Output label="نرخ تولید ساعتی کاتد (P_hr)" value={outputs.P_hr?.toFixed(3) || 0} unit="تن/ساعت" />
        </Card>
    </div>
);
const AcidTab = ({ inputs, outputs, onChange }) => (
     <div style={styles.grid}>
        <Card title="ورودی‌های بالانس اسید" icon={<FaWater />}>
            <Input id="AcidConsumption" label="مصرف اسید" unit="kg/ton" value={inputs.AcidConsumption} onChange={onChange} />
            <Input id="AcidDensity" label="چگالی اسید" unit="ton/m³" value={inputs.AcidDensity} onChange={onChange} />
            <Input id="AggloAcidPercent" label="درصد اسید در آگلومراسیون" unit="%" value={inputs.AggloAcidPercent} onChange={onChange} />
            <Input id="Q9" label="دبی جریان Bleed" unit="m³/h" value={inputs.Q9} onChange={onChange} />
            <Input id="A_con9" label="غلظت اسید در Bleed" unit="g/L" value={inputs.A_con9} onChange={onChange} />
        </Card>
        <Card title="نتایج بالانس اسید" icon={<FaChartBar />}>
            <Output label="دبی اسید به رافینیت (Q₁₃)" value={outputs.Q13?.toFixed(4) || 0} unit="m³/h" />
            <Output label="دبی اسید به آگلومراسیون (Q₂₀)" value={outputs.Q20?.toFixed(4) || 0} unit="m³/h" />
            <Output label="دبی اسید به EW (از Bleed) (Q₁₄)" value={outputs.Q14?.toFixed(4) || 0} unit="m³/h" />
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
                    <tr><th style={styles.helpTh}>نماد</th><th style={styles.helpTh}>شرح پارامتر</th><th style={styles.helpTh}>واحد</th></tr>
                </thead>
                <tbody>
                    {params.map(p => (<tr key={p.symbol}><td style={styles.helpTd}>{p.symbol}</td><td style={styles.helpTd}>{p.desc}</td><td style={styles.helpTd}>{p.unit}</td></tr>))}
                </tbody>
            </table>
        </Card>
    );
};

// =================================================================================
// Main App Component with Manual Calculation
// =================================================================================
const initialInputs = {
    P: 10000, wd: 350, wh: 24, R: 85, C_PLS_test: 3.5, Mh_ore: 150,
    heapHeight: 6, oreDensity: 1.6, A_evap: 10,
    AcidConsumption: 12, AcidDensity: 1.84, AggloAcidPercent: 25, Q9: 1, A_con9: 150,
    OA_Ratio: 1.2, Delta_Cu: 10,
};

function App() {
  const [activeTab, setActiveTab] = useState('summary');
  const [inputs, setInputs] = useState(initialInputs);
  const [outputs, setOutputs] = useState({});

  const handleInputChange = (id, value) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleCalculate = () => {
    const getNum = (val) => parseFloat(val) || 0;

    // --- 1. Read all inputs ---
    const { P, wd, wh, R: R_pct, C_PLS_test, Mh_ore, heapHeight, oreDensity, A_evap: A_evap_pct, AcidConsumption, AcidDensity, AggloAcidPercent: AggloAcidPercent_pct, Q9, A_con9, OA_Ratio, Delta_Cu } = inputs;

    // --- 2. Unit Conversions ---
    const R = getNum(R_pct) / 100;
    const A_evap = getNum(A_evap_pct) / 100;
    const AggloAcidPercent = getNum(AggloAcidPercent_pct) / 100;

    let calc = {};

    // --- 3. Calculation Chain ---
    const hourlyCuMass = (getNum(P) * 1000) / (getNum(wd) * getNum(wh));
    if (R > 0 && getNum(C_PLS_test) > 0) {
      calc.Q_PLS = hourlyCuMass / (getNum(C_PLS_test) * R);
    } else {
      calc.Q_PLS = 0;
    }
    calc.Q4 = calc.Q_PLS;
    calc.C4 = getNum(C_PLS_test);
    calc.Q11 = calc.Q4;
    calc.C11 = (1 - R) * calc.C4;
    calc.E_heap = A_evap * calc.Q11;
    calc.Q12 = calc.Q11 + calc.E_heap;
    calc.C12 = calc.Q12 > 0 ? (calc.Q11 * calc.C11) / calc.Q12 : 0;
    calc.Q5 = calc.Q4 * getNum(OA_Ratio);
    calc.C5 = calc.Q5 > 0 ? (calc.Q4 * calc.C4 * R) / calc.Q5 : 0;
    calc.Q8 = getNum(Delta_Cu) > 0 ? hourlyCuMass / getNum(Delta_Cu) : 0;
    calc.P_hr = (getNum(wd) > 0 && getNum(wh) > 0) ? getNum(P) / (getNum(wd) * getNum(wh)) : 0;
    
    if (getNum(AcidDensity) > 0) {
      const acidMassToRaff = getNum(AcidConsumption) * getNum(Mh_ore) * (1 - AggloAcidPercent);
      calc.Q13 = acidMassToRaff / (getNum(AcidDensity) * 1000);
      const acidMassToAgglo = getNum(AcidConsumption) * getNum(Mh_ore) * AggloAcidPercent;
      calc.Q20 = acidMassToAgglo / (getNum(AcidDensity) * 1000);
      const acidMassInBleed = getNum(Q9) * getNum(A_con9);
      calc.Q14 = acidMassInBleed / (getNum(AcidDensity) * 1000);
    } else {
      calc.Q13 = 0; calc.Q20 = 0; calc.Q14 = 0;
    }
    
    const totalOreAnual = getNum(Mh_ore) * getNum(wh) * getNum(wd);
    calc.totalVolume = getNum(oreDensity) > 0 ? totalOreAnual / getNum(oreDensity) : 0;
    calc.padArea = getNum(heapHeight) > 0 ? calc.totalVolume / getNum(heapHeight) : 0;
    calc.leachCycleTime = getNum(wd);

    setOutputs(calc);
    // Use a safe alert method
    if(typeof window !== 'undefined' && window.alert) {
        window.alert('محاسبات با موفقیت انجام شد و نتایج به‌روزرسانی شدند.');
    }
  };

  const handleReset = () => {
    setInputs(initialInputs);
    setOutputs({});
    if(typeof window !== 'undefined' && window.alert) {
        window.alert('تمام ورودی‌ها به مقادیر اولیه بازنشانی شدند.');
    }
  };

  const handleExport = () => {
    const exportInputs = Object.keys(initialInputs).map(key => ({
        'پارامتر': key,
        'مقدار': inputs[key],
    }));
    const exportOutputs = Object.keys(outputs).map(key => ({
        'پارامتر': key,
        'مقدار محاسبه شده': typeof outputs[key] === 'number' ? outputs[key].toFixed(3) : outputs[key],
    }));
    
    const ws_inputs = XLSX.utils.json_to_sheet(exportInputs);
    const ws_outputs = XLSX.utils.json_to_sheet(exportOutputs);
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
        <h1 style={styles.mainHeader}><FaCalculator /> ماشین حساب صنعتی هیپ لیچینگ (کنترل دستی)</h1>
        <div style={styles.tabs}>
          {tabs.map(tab => (
            <button key={tab.id} style={{ ...styles.tabButton, ...(activeTab === tab.id ? styles.tabButtonActive : {}) }} onClick={() => setActiveTab(tab.id)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div style={styles.tabContent}>
            {activeTab === 'summary' && <SummaryTab outputs={outputs} onCalculate={handleCalculate} onReset={handleReset} onExport={handleExport} />}
            {activeTab === 'inputs' && <InputsTab inputs={inputs} onChange={handleInputChange} />}
            {activeTab === 'pad' && <PadDesignTab inputs={inputs} outputs={outputs} onChange={handleInputChange} />}
            {activeTab === 'sx' && <SXTab inputs={inputs} outputs={outputs} onChange={handleInputChange} />}
            {activeTab === 'ew' && <EWTab inputs={inputs} outputs={outputs} onChange={handleInputChange} />}
            {activeTab === 'acid' && <AcidTab inputs={inputs} outputs={outputs} onChange={handleInputChange} />}
            {activeTab === 'help' && <HelpTab />}
        </div>
      </div>
    </div>
  );
}

export default App;
