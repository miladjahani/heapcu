import React, { useState, useEffect, useCallback } from 'react';
import { utils, writeFile } from 'xlsx';
import { ChevronsDown, HelpCircle, FileDown, Calculator, Settings, Droplets, Zap, Layers, AreaChart, Weight, Mountain, Cog, Hammer, Power, BarChart2, DollarSign, Briefcase, ExternalLink, Sparkles } from 'lucide-react';

// Helper component for styled input fields
const InputField = ({ label, unit, value, name, onChange, placeholder, tooltip, disabled = false }) => (
  <div className="relative mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor={name}>
      {label} <span className="text-cyan-400">({unit})</span>
    </label>
    <input
      type="number"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
    {tooltip && (
        <div className="absolute top-0 right-[-20px] text-gray-500 hover:text-cyan-400 cursor-pointer group">
            <HelpCircle size={16} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700 shadow-lg">
                {tooltip}
            </div>
        </div>
    )}
  </div>
);

// Helper component for displaying results
const ResultCard = ({ title, value, unit, icon, note, searchQuery }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between h-full">
    <div>
        <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-gray-700 p-3 rounded-full">
              {icon}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-cyan-400">
                {isNaN(value) || !isFinite(value) ? '۰' : value.toLocaleString('fa-IR', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">{unit}</p>
            </div>
            {searchQuery && (
                <a href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyan-400 transition" title="جستجوی آنلاین تجهیزات مشابه">
                    <ExternalLink size={20} />
                </a>
            )}
        </div>
    </div>
    {note && <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">{note}</p>}
  </div>
);

// Simple Pie Chart Component
const PieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-gray-500">{title}<br/>داده‌ای برای نمایش وجود ندارد.</div>;

    let cumulativePercent = 0;
    const segments = data.map(item => {
        const percent = item.value / total;
        const startAngle = cumulativePercent * 360;
        cumulativePercent += percent;
        const endAngle = cumulativePercent * 360;
        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const startX = 50 + 40 * Math.cos(Math.PI * startAngle / 180);
        const startY = 50 + 40 * Math.sin(Math.PI * startAngle / 180);
        const endX = 50 + 40 * Math.cos(Math.PI * endAngle / 180);
        const endY = 50 + 40 * Math.sin(Math.PI * endAngle / 180);

        return <path key={item.label} d={`M50,50 L${startX},${startY} A40,40 0 ${largeArcFlag},1 ${endX},${endY} Z`} fill={item.color} />;
    });

    return (
        <div className="flex flex-col items-center">
            <h4 className="text-md font-semibold text-white mb-2">{title}</h4>
            <svg viewBox="0 0 100 100" className="w-40 h-40">
                {segments}
            </svg>
            <div className="mt-4 text-xs w-full">
                {data.map(item => (
                    <div key={item.label} className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                            <span>{item.label}</span>
                        </div>
                        <span className="font-mono">{((item.value / total) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Main Application Component
export default function App() {
  const [inputs, setInputs] = useState({
    // Primary Inputs
    p: 50000, 
    wd: 350, 
    wh: 24,
    oreGrade: 1.2, 
    totalRecovery: 85,
    
    // Process Inputs
    R: 90, C4: 2.5, Q4: 950, acidConsumption: 15, delta_Cu: 15,
    
    // Heap Inputs
    oreDensity: 1.6, heapHeight: 8, leachCycle: 120,
    
    // Water Balance
    A: 5,
    
    // Organic Circuit
    ROA: 1.1, Q6: 940, C6: 0.4,
    
    // Acid Balance
    acidDensity: 1.84, Q9_bleed: 5, A_con9_bleed: 20,
    
    // Equipment Inputs
    pumpHead: 30, pumpEfficiency: 75, motorEfficiency: 90, workIndex: 15, f80: 150000, p80: 12000, cellVoltage: 2.1, currentEfficiency: 92, plsResidenceTime: 4, raffinateResidenceTime: 6,
    
    // Economics Inputs
    electricityPrice: 0.05, acidPrice: 150, laborCount: 50, avgLaborCost: 20000, maintenanceRate: 3,
    
    // CAPEX Factors
    pumpCostFactor: 1000, crusherCostFactor: 3000, rectifierCostFactor: 500, padCostFactor: 50, tankCostFactor: 250,
  });

  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [geminiAnalysis, setGeminiAnalysis] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculateAll = useCallback(() => {
    const allInputs = { ...inputs };
    const { 
        p, wd, wh, R, C4, Q4, acidConsumption, delta_Cu,
        oreGrade, totalRecovery, oreDensity, heapHeight, leachCycle,
        A,
        ROA, Q6, C6,
        acidDensity, Q9_bleed, A_con9_bleed,
        pumpHead, pumpEfficiency, motorEfficiency, workIndex, f80, p80, cellVoltage, currentEfficiency, plsResidenceTime, raffinateResidenceTime,
        electricityPrice, acidPrice, laborCount, avgLaborCost, maintenanceRate,
        pumpCostFactor, crusherCostFactor, rectifierCostFactor, padCostFactor, tankCostFactor
    } = Object.fromEntries(Object.entries(allInputs).map(([key, value]) => [key, Number(value) || 0]));

    // --- INTERDEPENDENT BASE CALCULATIONS ---
    const P_hr_ton = (wd > 0 && wh > 0) ? p / (wd * wh) : 0;
    const P_hr_kg = P_hr_ton * 1000;
    const dailyCopperProduction = wd > 0 ? p / wd : 0;
    const requiredOreFeedRate = (oreGrade > 0 && totalRecovery > 0) ? dailyCopperProduction / (oreGrade / 100 * totalRecovery / 100) : 0;
    const hourlyOreFeedRate = wh > 0 ? requiredOreFeedRate / wh : 0;
    const totalOreOnHeap = requiredOreFeedRate * leachCycle;
    const requiredHeapArea = (heapHeight > 0 && oreDensity > 0) ? totalOreOnHeap / (heapHeight * oreDensity) : 0;

    // --- PROCESS CALCULATIONS (Based on provided formulas) ---
    const Q8 = delta_Cu > 0 ? (P_hr_ton * 1000) / delta_Cu : 0;
    const Q11 = Q4;
    const C11 = (1 - R / 100) * C4;
    const E_heap = (A / 100) * Q11;
    const Q19 = E_heap;
    const Q12 = Q11 + Q19;
    const C12 = Q12 > 0 ? (Q11 * C11) / Q12 : 0;
    const Q5 = Q4 * ROA;
    const C5 = Q5 > 0 ? ((R / 100) * C4 * Q4 + C6 * Q6) / Q5 : 0;
    const Q13 = (acidDensity > 0) ? (acidConsumption * hourlyOreFeedRate) / (acidDensity * 1000) : 0;
    const Q14 = (acidDensity > 0) ? (Q9_bleed * A_con9_bleed) / (1000 * acidDensity) : 0;

    // --- EQUIPMENT SIZING ---
    const g = 9.81, rho = 1000, eff_factor = (pumpEfficiency / 100) * (motorEfficiency / 100);
    const plsPumpPower = eff_factor > 0 ? (Q4 / 3600 * pumpHead * g * rho) / (eff_factor * 1000) : 0;
    const raffinatePumpPower = eff_factor > 0 ? (Q11 / 3600 * pumpHead * g * rho) / (eff_factor * 1000) : 0;
    const bondPower_kWh_t = (p80 > 0 && f80 > 0) ? workIndex * 10 * (1/Math.sqrt(p80) - 1/Math.sqrt(f80)) : 0;
    const crusherPower = bondPower_kWh_t * hourlyOreFeedRate;
    const totalCurrent = (currentEfficiency > 0) ? (P_hr_kg / 3600 * 2 * 96485) / (63.546 * (currentEfficiency / 100)) : 0;
    const rectifierPowerDC = (totalCurrent * cellVoltage) / 1000;
    const rectifierPowerAC = rectifierPowerDC / (motorEfficiency / 100);
    const plsTankVolume = Q4 * plsResidenceTime;
    const raffinateTankVolume = Q11 * raffinateResidenceTime;
    const totalPowerConsumption = plsPumpPower + raffinatePumpPower + crusherPower + rectifierPowerAC;

    // --- CAPEX Calculations ---
    const capex_pumps = (plsPumpPower + raffinatePumpPower) * pumpCostFactor;
    const capex_crusher = crusherPower * crusherCostFactor;
    const capex_rectifier = rectifierPowerAC * rectifierCostFactor;
    const capex_pad = requiredHeapArea * padCostFactor;
    const capex_tanks = (plsTankVolume + raffinateTankVolume) * tankCostFactor;
    const totalCapex = capex_pumps + capex_crusher + capex_rectifier + capex_pad + capex_tanks;

    // --- OPEX Calculations ---
    const annualHours = wd * wh;
    const opex_power = totalPowerConsumption * annualHours * electricityPrice;
    const annualAcidConsumption = requiredOreFeedRate * wd * acidConsumption / 1000; // in tons
    const opex_reagents = annualAcidConsumption * acidPrice;
    const opex_labor = laborCount * avgLaborCost;
    const opex_maintenance = totalCapex * (maintenanceRate / 100);
    const totalOpex = opex_power + opex_reagents + opex_labor + opex_maintenance;
    const productionCostPerTon = p > 0 ? totalOpex / p : 0;

    setResults({
      P_hr_ton, hourlyOreFeedRate, requiredHeapArea, C11, Q11, Q8, E_heap, Q19, Q12, C12, Q5, C5, Q13, Q14,
      plsPumpPower, raffinatePumpPower, crusherPower, rectifierPowerDC, rectifierPowerAC, plsTankVolume, raffinateTankVolume,
      totalPowerConsumption,
      capex_pumps, capex_crusher, capex_rectifier, capex_pad, capex_tanks, totalCapex,
      opex_power, opex_reagents, opex_labor, opex_maintenance, totalOpex,
      productionCostPerTon
    });
  }, [inputs]);

  useEffect(() => {
    calculateAll();
  }, [inputs, calculateAll]);

  const callGeminiApi = useCallback(async () => {
    setIsGenerating(true);
    setGeminiAnalysis('');

    const prompt = `
        You are an expert metallurgical engineering consultant specializing in copper heap leaching projects.
        Analyze the following project data and provide a concise, insightful report for a project manager. 
        Focus on key economic indicators (CAPEX, OPEX, cost per ton), potential risks, and actionable recommendations.
        Structure your response with clear headings and bullet points.
        The response MUST be in Persian.

        Here is the project data:
        ---
        **Project Goals & Key Inputs:**
        - Annual Copper Production Target: ${inputs.p.toLocaleString('fa-IR')} tons
        - Ore Grade: ${inputs.oreGrade}%
        - Total Process Recovery: ${inputs.totalRecovery}%
        - Leach Cycle: ${inputs.leachCycle} days
        - Electricity Price: $${inputs.electricityPrice}/kWh
        - Sulfuric Acid Price: $${inputs.acidPrice}/ton

        **Key Calculated Results:**
        - **Total CAPEX:** $${results.totalCapex?.toLocaleString('fa-IR', {maximumFractionDigits: 0})}
        - **Total Annual OPEX:** $${results.totalOpex?.toLocaleString('fa-IR', {maximumFractionDigits: 0})}
        - **Production Cost per Ton of Copper:** $${results.productionCostPerTon?.toLocaleString('fa-IR', {maximumFractionDigits: 0})}
        - **Total Power Consumption:** ${results.totalPowerConsumption?.toLocaleString('fa-IR', {maximumFractionDigits: 0})} kW
        - **Required Heap Area:** ${results.requiredHeapArea?.toLocaleString('fa-IR', {maximumFractionDigits: 0})} m²
        - **Hourly Ore Feed Rate:** ${results.hourlyOreFeedRate?.toLocaleString('fa-IR', {maximumFractionDigits: 0})} tons/hr
        ---

        Please provide your expert analysis based on this data.
    `;
    
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = ""; // Canvas will provide the key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setGeminiAnalysis(text);
        } else {
            setGeminiAnalysis("پاسخی از سرویس هوش مصنوعی دریافت نشد. لطفاً ساختار پاسخ API را بررسی کنید.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        setGeminiAnalysis("خطا در ارتباط با سرویس هوش مصنوعی. لطفاً اتصال اینترنت و کنسول مرورگر را برای جزئیات بیشتر بررسی کنید.");
    } finally {
        setIsGenerating(false);
    }
  }, [inputs, results]);

  const exportAllToExcel = () => {
    const wb = utils.book_new();

    // Data for each sheet
    const dashboardData = [
        { 'شاخص': 'کل سرمایه‌گذاری (CAPEX)', 'مقدار': results.totalCapex, 'واحد': 'دلار' },
        { 'شاخص': 'هزینه عملیاتی سالانه (OPEX)', 'مقدار': results.totalOpex, 'واحد': 'دلار' },
        { 'شاخص': 'هزینه تولید هر تن مس', 'مقدار': results.productionCostPerTon, 'واحد': 'دلار بر تن' },
        { 'شاخص': 'کل توان مصرفی', 'مقدار': results.totalPowerConsumption, 'واحد': 'کیلووات' },
        { 'شاخص': 'نرخ خوراک ساعتی', 'مقدار': results.hourlyOreFeedRate, 'واحد': 'تن در ساعت' },
        { 'شاخص': 'سطح مورد نیاز پد', 'مقدار': results.requiredHeapArea, 'واحد': 'متر مربع' },
    ];
    
    const processData = [
        ...Object.entries(inputs).map(([k,v]) => ({'دسته': 'ورودی', 'پارامتر': k, 'مقدار': v})),
        ...Object.entries(results).map(([k,v]) => ({'دسته': 'خروجی', 'پارامتر': k, 'مقدار': v})),
    ];

    const ws_dashboard = utils.json_to_sheet(dashboardData);
    utils.book_append_sheet(wb, ws_dashboard, "داشبورد");

    const ws_all_data = utils.json_to_sheet(processData);
    utils.book_append_sheet(wb, ws_all_data, "تمام داده‌ها");

    writeFile(wb, "گزارش_جامع_لیچینگ.xlsx");
  };

  const renderDashboard = () => {
    const capexData = [
        { label: 'پد لیچینگ', value: results.capex_pad || 0, color: '#0e7490' },
        { label: 'سنگ‌شکن', value: results.capex_crusher || 0, color: '#059669' },
        { label: 'EW', value: results.capex_rectifier || 0, color: '#f59e0b' },
        { label: 'پمپ و مخازن', value: (results.capex_pumps || 0) + (results.capex_tanks || 0), color: '#6366f1' },
    ];
    const opexData = [
        { label: 'انرژی', value: results.opex_power || 0, color: '#f59e0b' },
        { label: 'نیروی انسانی', value: results.opex_labor || 0, color: '#3b82f6' },
        { label: 'نگهداری', value: results.opex_maintenance || 0, color: '#ef4444' },
        { label: 'مواد مصرفی', value: results.opex_reagents || 0, color: '#10b981' },
    ];

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">داشبورد مدیریتی</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <ResultCard title="کل سرمایه‌گذاری (CAPEX)" value={results.totalCapex} unit="دلار" icon={<Briefcase className="text-blue-400" size={24}/>} />
                <ResultCard title="هزینه عملیاتی سالانه (OPEX)" value={results.totalOpex} unit="دلار" icon={<DollarSign className="text-green-400" size={24}/>} />
                <ResultCard title="هزینه تولید هر تن مس" value={results.productionCostPerTon} unit="دلار بر تن" icon={<BarChart2 className="text-yellow-400" size={24}/>} />
                <ResultCard title="کل توان مصرفی" value={results.totalPowerConsumption} unit="کیلووات" icon={<Power className="text-red-400" size={24}/>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">تحلیل هوشمند با Gemini</h3>
                        <button onClick={callGeminiApi} disabled={isGenerating} className="flex items-center space-x-2 space-x-reverse bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-wait">
                            <Sparkles size={20} />
                            <span>{isGenerating ? 'در حال تحلیل...' : 'دریافت تحلیل هوشمند'}</span>
                        </button>
                    </div>
                    {isGenerating && (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
                        </div>
                    )}
                    {geminiAnalysis && (
                         <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-cyan-400 text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: geminiAnalysis.replace(/\n/g, '<br />') }}></div>
                    )}
                    {!isGenerating && !geminiAnalysis && (
                        <div className="text-center text-gray-500 py-10">
                            <p>برای دریافت تحلیل تخصصی پروژه بر اساس داده‌های فعلی، روی دکمه بالا کلیک کنید.</p>
                        </div>
                    )}
                     <p className="text-xs text-gray-600 mt-4 pt-2 border-t border-gray-700">توجه: این تحلیل توسط هوش مصنوعی ارائه شده و باید توسط متخصص بازبینی شود.</p>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex flex-col space-y-6">
                    <PieChart data={capexData} title="تفکیک هزینه‌های سرمایه‌گذاری (CAPEX)" />
                    <PieChart data={opexData} title="تفکیک هزینه‌های عملیاتی (OPEX)" />
                </div>
            </div>
        </div>
    );
  };
  
  const renderEconomics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
        <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های اقتصادی</h2>
            <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">هزینه‌های عملیاتی (OPEX)</h3>
            <InputField label="قیمت برق" unit="دلار/کیلووات ساعت" name="electricityPrice" value={inputs.electricityPrice} onChange={handleInputChange} />
            <InputField label="قیمت اسید" unit="دلار/تن" name="acidPrice" value={inputs.acidPrice} onChange={handleInputChange} />
            <InputField label="تعداد نیروی انسانی" unit="نفر" name="laborCount" value={inputs.laborCount} onChange={handleInputChange} />
            <InputField label="متوسط هزینه سالانه هر نفر" unit="دلار" name="avgLaborCost" value={inputs.avgLaborCost} onChange={handleInputChange} />
            <InputField label="نرخ نگهداری سالانه" unit="% از CAPEX" name="maintenanceRate" value={inputs.maintenanceRate} onChange={handleInputChange} />
        </div>
        <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">فاکتورهای هزینه (CAPEX)</h2>
            <p className="text-xs text-gray-400 mb-4">این مقادیر تقریبی هستند و برای مناطق مختلف متفاوتند.</p>
            <InputField label="فاکتور هزینه پمپ" unit="دلار/کیلووات" name="pumpCostFactor" value={inputs.pumpCostFactor} onChange={handleInputChange} />
            <InputField label="فاکتور هزینه سنگ‌شکن" unit="دلار/کیلووات" name="crusherCostFactor" value={inputs.crusherCostFactor} onChange={handleInputChange} />
            <InputField label="فاکتور هزینه رکتیفایر" unit="دلار/کیلووات" name="rectifierCostFactor" value={inputs.rectifierCostFactor} onChange={handleInputChange} />
            <InputField label="هزینه ساخت پد" unit="دلار/متر مربع" name="padCostFactor" value={inputs.padCostFactor} onChange={handleInputChange} />
            <InputField label="هزینه ساخت مخزن" unit="دلار/متر مکعب" name="tankCostFactor" value={inputs.tankCostFactor} onChange={handleInputChange} />
        </div>
        <div className="lg:col-span-1">
             <h2 className="text-2xl font-bold text-white mb-6">نتایج اقتصادی</h2>
             <div className="space-y-4">
                 <ResultCard title="کل سرمایه‌گذاری (CAPEX)" value={results.totalCapex} unit="دلار" icon={<Briefcase className="text-blue-400" size={24}/>} />
                 <ResultCard title="هزینه عملیاتی سالانه (OPEX)" value={results.totalOpex} unit="دلار" icon={<DollarSign className="text-green-400" size={24}/>} />
                 <ResultCard title="هزینه تولید هر تن مس" value={results.productionCostPerTon} unit="دلار بر تن" icon={<BarChart2 className="text-yellow-400" size={24}/>} />
             </div>
        </div>
    </div>
  );

  const renderProcess = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های فرآیند</h2>
        
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">پارامترهای اصلی تولید</h3>
        <InputField label="مقدار تولید سالانه" unit="تن" name="p" value={inputs.p} onChange={handleInputChange} tooltip="کل مس کاتدی تولید شده در یک سال." />
        <InputField label="روز کاری سال" unit="روز" name="wd" value={inputs.wd} onChange={handleInputChange} />
        <InputField label="ساعت کاری روز" unit="ساعت" name="wh" value={inputs.wh} onChange={handleInputChange} />
        
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">پارامترهای استخراج (SX)</h3>
        <InputField label="بازیابی کلی SX" unit="%" name="R" value={inputs.R} onChange={handleInputChange} tooltip="درصد مس منتقل شده از فاز آبی به فاز آلی در واحد استخراج."/>
        <InputField label="دبی PLS به SX (Q4)" unit="متر مکعب/ساعت" name="Q4" value={inputs.Q4} onChange={handleInputChange} tooltip="دبی محلول باردار (PLS) ورودی به واحد استخراج."/>
        <InputField label="غلظت مس در PLS (C4)" unit="گرم/لیتر" name="C4" value={inputs.C4} onChange={handleInputChange} tooltip="غلظت مس در محلول باردار ورودی به واحد استخراج."/>
        <InputField label="نسبت O:A" unit="-" name="ROA" value={inputs.ROA} onChange={handleInputChange} tooltip="نسبت حجمی فاز آلی به فاز آبی در میکسر-سترها."/>
        <InputField label="دبی آلی برگشتی (Q6)" unit="متر مکعب/ساعت" name="Q6" value={inputs.Q6} onChange={handleInputChange} />
        <InputField label="غلظت مس آلی برگشتی (C6)" unit="گرم/لیتر" name="C6" value={inputs.C6} onChange={handleInputChange} />

        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">پارامترهای الکترووینینگ (EW)</h3>
        <InputField label="افت غلظت مس (ΔCu)" unit="گرم/لیتر" name="delta_Cu" value={inputs.delta_Cu} onChange={handleInputChange} tooltip="میزان کاهش غلظت مس در الکترولیت پس از عبور از سلول‌های الکترووینینگ."/>
        
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">بیلان آب و اسید</h3>
        <InputField label="درصد تبخیر (A)" unit="%" name="A" value={inputs.A} onChange={handleInputChange} tooltip="درصد آب تبخیر شده از سطح هیپ‌ها و استخرها."/>
        <InputField label="مصرف اسید" unit="کیلوگرم/تن سنگ" name="acidConsumption" value={inputs.acidConsumption} onChange={handleInputChange} tooltip="میزان اسید سولفوریک مصرفی به ازای هر تن سنگ معدنی."/>
        <InputField label="چگالی اسید" unit="تن/متر مکعب" name="acidDensity" value={inputs.acidDensity} onChange={handleInputChange} />
        <InputField label="دبی جریان بلید (Q9)" unit="متر مکعب/ساعت" name="Q9_bleed" value={inputs.Q9_bleed} onChange={handleInputChange} />
        <InputField label="غلظت اسید بلید (Acon9)" unit="گرم/لیتر" name="A_con9_bleed" value={inputs.A_con9_bleed} onChange={handleInputChange} />

      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">نتایج جامع فرآیند</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultCard title="دبی الکترولیت مصرفی (Q8)" value={results.Q8} unit="متر مکعب/ساعت" icon={<Zap className="text-yellow-400" size={24}/>} />
            <ResultCard title="دبی رافینت از SX (Q11)" value={results.Q11} unit="متر مکعب/ساعت" icon={<Droplets className="text-blue-400" size={24}/>} />
            <ResultCard title="غلظت مس رافینت (C11)" value={results.C11} unit="گرم/لیتر" icon={<Droplets className="text-blue-400" size={24}/>} />
            <ResultCard title="نرخ تبخیر آب (E_heap)" value={results.E_heap} unit="متر مکعب/ساعت" icon={<Droplets className="text-red-400" size={24}/>} />
            <ResultCard title="آب جبرانی (Q19)" value={results.Q19} unit="متر مکعب/ساعت" icon={<Droplets className="text-green-400" size={24}/>} />
            <ResultCard title="دبی رافینت به هیپ (Q12)" value={results.Q12} unit="متر مکعب/ساعت" icon={<Droplets className="text-purple-400" size={24}/>} />
            <ResultCard title="غلظت مس رافینت به هیپ (C12)" value={results.C12} unit="گرم/لیتر" icon={<Droplets className="text-purple-400" size={24}/>} />
            <ResultCard title="دبی آلی باردار (Q5)" value={results.Q5} unit="متر مکعب/ساعت" icon={<Droplets className="text-orange-400" size={24}/>} />
            <ResultCard title="غلظت مس آلی باردار (C5)" value={results.C5} unit="گرم/لیتر" icon={<Droplets className="text-orange-400" size={24}/>} />
            <ResultCard title="نرخ مصرف اسید در هیپ (Q13)" value={results.Q13} unit="متر مکعب/ساعت" icon={<Droplets className="text-red-500" size={24}/>} />
            <ResultCard title="میزان اسید خروجی با بلید (Q14)" value={results.Q14} unit="متر مکعب/ساعت" icon={<Droplets className="text-red-500" size={24}/>} />
        </div>
      </div>
    </div>
  );

  const renderHeapDesign = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های طراحی هیپ</h2>
        <InputField label="عیار ماده معدنی" unit="%" name="oreGrade" value={inputs.oreGrade} onChange={handleInputChange} tooltip="درصد مس قابل لیچ در سنگ معدن." />
        <InputField label="بازیابی کل فرآیند" unit="%" name="totalRecovery" value={inputs.totalRecovery} onChange={handleInputChange} tooltip="راندمان کلی از سنگ معدن تا کاتد مس." />
        <InputField label="چگالی سنگ معدن" unit="تن/متر مکعب" name="oreDensity" value={inputs.oreDensity} onChange={handleInputChange} tooltip="جرم سنگ معدن در واحد حجم." />
        <InputField label="ارتفاع هیپ" unit="متر" name="heapHeight" value={inputs.heapHeight} onChange={handleInputChange} tooltip="ارتفاع پشته سنگ معدنی روی پد." />
        <InputField label="چرخه لیچینگ" unit="روز" name="leachCycle" value={inputs.leachCycle} onChange={handleInputChange} tooltip="مدت زمانی که سنگ معدن تحت آبیاری قرار می‌گیرد." />
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">نتایج طراحی هیپ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultCard title="نرخ خوراک ساعتی" value={results.hourlyOreFeedRate} unit="تن در ساعت" icon={<Settings className="text-yellow-500" size={24}/>} />
            <ResultCard title="سطح مورد نیاز برای لیچینگ" value={results.requiredHeapArea} unit="متر مربع" icon={<AreaChart className="text-green-400" size={24}/>} />
        </div>
      </div>
    </div>
  );

  const renderEquipmentSizing = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های تخمین تجهیزات</h2>
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">پمپ‌ها</h3>
        <InputField label="هد دینامیکی کل" unit="متر" name="pumpHead" value={inputs.pumpHead} onChange={handleInputChange} tooltip="افت فشار کل در مسیر پمپاژ."/>
        <InputField label="راندمان پمپ" unit="%" name="pumpEfficiency" value={inputs.pumpEfficiency} onChange={handleInputChange} />
        <InputField label="راندمان الکتروموتور" unit="%" name="motorEfficiency" value={inputs.motorEfficiency} onChange={handleInputChange} />
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">سنگ‌شکن</h3>
        <InputField label="شاخص کار باند (Wi)" unit="kWh/t" name="workIndex" value={inputs.workIndex} onChange={handleInputChange} tooltip="انرژی مورد نیاز برای خردایش سنگ."/>
        <InputField label="اندازه 80% خوراک (F80)" unit="میکرون" name="f80" value={inputs.f80} onChange={handleInputChange} />
        <InputField label="اندازه 80% محصول (P80)" unit="میکرون" name="p80" value={inputs.p80} onChange={handleInputChange} />
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">الکترووینینگ</h3>
        <InputField label="ولتاژ سلول" unit="ولت" name="cellVoltage" value={inputs.cellVoltage} onChange={handleInputChange} />
        <InputField label="راندمان جریانی" unit="%" name="currentEfficiency" value={inputs.currentEfficiency} onChange={handleInputChange} />
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">مخازن</h3>
        <InputField label="زمان ماند مخزن PLS" unit="ساعت" name="plsResidenceTime" value={inputs.plsResidenceTime} onChange={handleInputChange} />
        <InputField label="زمان ماند مخزن رافینت" unit="ساعت" name="raffinateResidenceTime" value={inputs.raffinateResidenceTime} onChange={handleInputChange} />
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">پیشنهاد اولیه برای تجهیزات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultCard title="توان پمپ PLS" value={results.plsPumpPower} unit="کیلووات" icon={<Power className="text-blue-400" size={24}/>} searchQuery={`خرید پمپ سانتریفیوژ ${Math.round(results.plsPumpPower)}kW ${inputs.pumpHead}m head`} />
            <ResultCard title="توان پمپ رافینت" value={results.raffinatePumpPower} unit="کیلووات" icon={<Power className="text-blue-400" size={24}/>} searchQuery={`خرید پمپ ضد اسید ${Math.round(results.raffinatePumpPower)}kW ${inputs.pumpHead}m head`} />
            <ResultCard title="توان سنگ‌شکن" value={results.crusherPower} unit="کیلووات" icon={<Hammer className="text-red-500" size={24}/>} searchQuery={`خرید سنگ شکن مخروطی ${Math.round(results.hourlyOreFeedRate)} تن بر ساعت`} />
            <ResultCard title="توان DC رکتیفایر" value={results.rectifierPowerDC} unit="کیلووات" icon={<Zap className="text-yellow-400" size={24}/>} searchQuery={`خرید رکتیفایر ${Math.round(results.rectifierPowerDC)}kW`}/>
            <ResultCard title="توان AC ترانسفورماتور" value={results.rectifierPowerAC} unit="کیلووات" icon={<Zap className="text-yellow-400" size={24}/>} note="با احتساب راندمان" searchQuery={`خرید ترانسفورماتور ${Math.round(results.rectifierPowerAC)}kVA`}/>
            <ResultCard title="حجم مخزن PLS" value={results.plsTankVolume} unit="متر مکعب" icon={<Droplets className="text-green-400" size={24}/>} />
            <ResultCard title="حجم مخزن رافینت" value={results.raffinateTankVolume} unit="متر مکعب" icon={<Droplets className="text-purple-400" size={24}/>} />
        </div>
        <div className="mt-8 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">نکات مهم</h3>
            <p className="text-gray-300 leading-relaxed">
                <strong>توجه:</strong> مقادیر فوق تخمین‌های اولیه برای مطالعات امکان‌سنجی (Feasibility Study) هستند. در این محاسبات از ضرایب اطمینان استفاده نشده است. برای طراحی دقیق و خرید تجهیزات، حتماً باید با سازندگان و مهندسان مشاور مشورت کرده و محاسبات دقیق مهندسی را انجام دهید.
            </p>
        </div>
      </div>
    </div>
  );

  const renderHelp = () => (
    <div className="p-4 md:p-8 text-gray-300 leading-loose max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">راهنمای جامع ابزار</h2>
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">داشبورد مدیریتی</h3>
            <p>این بخش یک نمای کلی از مهم‌ترین شاخص‌های فنی و اقتصادی پروژه را ارائه می‌دهد. بخش "تحلیل هوشمند با Gemini" با استفاده از هوش مصنوعی، تحلیل‌ها و توصیه‌های دقیقی را بر اساس داده‌های شما ارائه می‌دهد که به شناسایی سریع نقاط قوت، ضعف و ریسک‌های پروژه کمک می‌کند.</p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">تحلیل اقتصادی</h3>
            <p>در این بخش می‌توانید با وارد کردن هزینه‌های مربوط به منطقه خود، برآورد دقیقی از هزینه‌های سرمایه‌گذاری (CAPEX) و عملیاتی (OPEX) داشته باشید. شاخص نهایی "هزینه تولید هر تن مس" مهم‌ترین معیار برای تصمیم‌گیری در مورد اقتصادی بودن پروژه است.</p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">تجهیزات، هیپ و فرآیند</h3>
            <p>این سه بخش، هسته فنی محاسبات را تشکیل می‌دهند. شما می‌توانید تمام پارامترهای طراحی از جمله مشخصات سنگ معدن، ابعاد هیپ، دبی‌ها و غلظت‌ها را در این بخش‌ها وارد کرده و نتایج دقیق مهندسی را برای طراحی اولیه استخراج نمایید.</p>
        </div>
    </div>
  );

  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center space-x-2 space-x-reverse font-semibold px-4 py-2 rounded-t-lg transition-colors duration-300 ${
        activeTab === tabName
          ? 'bg-gray-900/50 border-b-2 border-cyan-500 text-cyan-400'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen font-sans text-white" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
       <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap" rel="stylesheet" />
      
      <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg p-4 sticky top-0 z-20 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Sparkles className="text-cyan-400" size={32} />
            <h1 className="text-2xl font-bold">مشاور هوشمند لیچینگ</h1>
          </div>
          <nav className="flex space-x-1 space-x-reverse border-b-0">
            <TabButton tabName="dashboard" label="داشبورد" icon={<BarChart2 size={18}/>} />
            <TabButton tabName="economics" label="تحلیل اقتصادی" icon={<DollarSign size={18}/>} />
            <TabButton tabName="equipment" label="تجهیزات" icon={<Cog size={18}/>} />
            <TabButton tabName="heap" label="طراحی هیپ" icon={<Layers size={18}/>} />
            <TabButton tabName="process" label="فرآیند" icon={<Calculator size={18}/>} />
            <TabButton tabName="help" label="راهنما" icon={<HelpCircle size={18}/>} />
          </nav>
        </div>
      </header>

      <main className="container mx-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'economics' && renderEconomics()}
        {activeTab === 'equipment' && renderEquipmentSizing()}
        {activeTab === 'heap' && renderHeapDesign()}
        {activeTab === 'process' && renderProcess()}
        {activeTab === 'help' && renderHelp()}
      </main>

      <footer className="text-center p-4 text-gray-500 text-sm mt-8">
        <p>ابزار جامع امکان‌سنجی | طراح: میلاد جهانی | قدرت‌گرفته از هوش مصنوعی Gemini</p>
        <button onClick={exportAllToExcel} className="mt-2 flex mx-auto items-center space-x-2 space-x-reverse bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg">
            <FileDown size={20} />
            <span>دانلود گزارش جامع اکسل</span>
        </button>
      </footer>
    </div>
  );
}
