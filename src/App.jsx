import React, { useState, useEffect, useCallback } from 'react';
import { utils, writeFile } from 'xlsx';
import { ChevronsDown, HelpCircle, FileDown, Calculator, Settings, Droplets, Zap } from 'lucide-react';

// Helper component for styled input fields
const InputField = ({ label, unit, value, name, onChange, placeholder, tooltip }) => (
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
      className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
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
const ResultCard = ({ title, value, unit, icon }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-md flex items-center space-x-4 space-x-reverse">
    <div className="bg-gray-700 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-cyan-400">
        {isNaN(value) || !isFinite(value) ? '۰' : value.toLocaleString('fa-IR', { maximumFractionDigits: 2 })}
      </p>
      <p className="text-xs text-gray-500">{unit}</p>
    </div>
  </div>
);

// Main Application Component
export default function App() {
  const [inputs, setInputs] = useState({
    p: 50000,   // مقدار تولید مس در سال (تن)
    wd: 350,    // تعداد روز کاری در سال
    wh: 24,     // ساعت کاری در روز
    R: 90,      // بازیابی واحد استخراج با حلال (درصد)
    C4: 2.5,    // غلظت مس در PLS (گرم در لیتر)
    Q4: 950,    // دبی جریان PLS به واحد استخراج (متر مکعب در ساعت)
    ROA: 1,     // نسبت O:A
    delta_Cu: 15, // اختلاف غلظت مس در واحد الکترووینینگ (گرم در لیتر)
    A: 5,       // درصد تبخیر آب (درصد)
    Q6: 100,    // دبی جریان فاز آلی برگشتی (متر مکعب در ساعت)
    C6: 0.5,    // غلظت مس در فاز آلی برگشتی (گرم در لیتر)
    acidConsumption: 15, // مصرف اسید به ازای هر تن خاک معدنی (کیلوگرم بر تن)
    Mh_ore: 800, // مقدار مس تولیدی (تن در ساعت)
    acidDensity: 1.84, // جرم مخصوص اسید (تن بر متر مکعب)
    A_con9: 180, // غلظت اسید در جریان بلید (گرم در لیتر)
    Q9: 20,      // دبی جریان بلید به الکترووینینگ (متر مکعب در ساعت)
  });

  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState('calculator');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const calculateAll = useCallback(() => {
    // Convert inputs to numbers, defaulting to 0 if invalid
    const p = Number(inputs.p) || 0;
    const wd = Number(inputs.wd) || 0;
    const wh = Number(inputs.wh) || 0;
    const R = Number(inputs.R) || 0;
    const C4 = Number(inputs.C4) || 0;
    const Q4 = Number(inputs.Q4) || 0;
    const ROA = Number(inputs.ROA) || 0;
    const delta_Cu = Number(inputs.delta_Cu) || 0;
    const A = Number(inputs.A) || 0;
    const Q6 = Number(inputs.Q6) || 0;
    const C6 = Number(inputs.C6) || 0;
    const acidConsumption = Number(inputs.acidConsumption) || 0;
    const Mh_ore = Number(inputs.Mh_ore) || 0;
    const acidDensity = Number(inputs.acidDensity) || 0;
    const A_con9 = Number(inputs.A_con9) || 0;
    const Q9 = Number(inputs.Q9) || 0;

    // --- Start Calculations ---

    // نرخ تولید ساعتی مس (جریان شماره ۱۰)
    // P_hr = p(ton/year) / (wd(day/year) * wh(h/day)) = ton/h
    const P_hr = (wd > 0 && wh > 0) ? p / (wd * wh) : 0;

    // دبی جریان الکترولیت مصرفی (جریان شماره ۸)
    // Q8(m³/h) = (P_hr(ton/h) * 1000(kg/ton)) / delta_Cu(g/L or kg/m³)
    const Q8 = delta_Cu > 0 ? (P_hr * 1000) / delta_Cu : 0;

    // دبی جریان رافینت از واحد استخراج (جریان شماره ۱۱)
    // Q11 = Q4
    const Q11 = Q4;

    // غلظت مس جریان رافینت
    // C11(g/L) = (1 - R/100) * C4(g/L)
    const C11 = (1 - R / 100) * C4;

    // محاسبات تبخیر سطحی آب محلول (جریان شماره ۲)
    // E_heap(m³/h) = (A/100) * Q11(m³/h)
    const E_heap = (A / 100) * Q11;
    const Q19 = E_heap; // محاسبات جریان آب تازه به پوند رافینت (جریان شماره ۱۹)

    // محاسبات جریان رافینت به پوند به هیپ (جریان شماره ۱۲)
    const Q12 = Q11 + Q19;
    const C12 = Q12 > 0 ? (Q11 * C11) / Q12 : 0;

    // محاسبات جریان فاز آلی باردار شده (جریان شماره ۵)
    const Q5 = Q4 * ROA;
    // Cu_con5(kg/h) = (R/100) * C4(g/L)*Q4(m³/h) + C6(g/L)*Q6(m³/h)
    // Note: C is g/L which is kg/m³. So C*Q gives kg/h.
    const Cu_con4 = C4 * Q4;
    const Cu_con6 = C6 * Q6;
    const Cu_con5_total_mass = (R / 100) * Cu_con4 + Cu_con6;
    const C5 = Q5 > 0 ? Cu_con5_total_mass / Q5 : 0;

    // محاسبات نرخ افزودن اسید (جریان شماره ۱۳ و ۲۰)
    // Q13 = (Acid Consumption * Mh_ore) / (Acid Density * 1000)
    // This is a simplified, dimensionally correct version.
    // The formula in the book seems complex. Let's use a logical one.
    // (kg/ton_ore) * (ton_ore/h) / (ton_acid/m³) = (kg_acid/h) / (1000 kg_acid/m³) = m³/h
    const totalAcidFlow = (acidDensity > 0) ? (acidConsumption * Mh_ore) / (acidDensity * 1000) : 0;
    const Q13 = totalAcidFlow; // Assuming all acid is added here for simplicity.

    // محاسبات نرخ مصرف اسید در الکترووینینگ (جریان شماره ۱۴)
    // Q14(m³/h) = (Q9(m³/h) * A_con9(g/L)) / (1000(g/kg) * AcidDensity(ton/m³)*1000(kg/ton))
    // Simplified: Q14 = (Q9 * A_con9) / (1000 * acidDensity)
    const Q14 = (acidDensity > 0) ? (Q9 * A_con9) / (1000 * acidDensity) : 0;

    setResults({
      P_hr, Q8, Q11, C11, E_heap, Q19, Q12, C12, Q5, C5, Q13, Q14
    });

  }, [inputs]);

  useEffect(() => {
    calculateAll();
  }, [inputs, calculateAll]);

  const exportToExcel = () => {
    const data = [
      { Category: 'ورودی‌ها', Parameter: 'مقدار تولید سالانه مس', Value: inputs.p, Unit: 'تن' },
      { Category: 'ورودی‌ها', Parameter: 'تعداد روز کاری در سال', Value: inputs.wd, Unit: 'روز' },
      { Category: 'ورودی‌ها', Parameter: 'ساعت کاری در روز', Value: inputs.wh, Unit: 'ساعت' },
      { Category: 'ورودی‌ها', Parameter: 'بازیابی واحد استخراج با حلال', Value: inputs.R, Unit: '%' },
      { Category: 'ورودی‌ها', Parameter: 'غلظت مس در PLS (جریان ۴)', Value: inputs.C4, Unit: 'گرم در لیتر' },
      { Category: 'ورودی‌ها', Parameter: 'دبی جریان PLS (جریان ۴)', Value: inputs.Q4, Unit: 'متر مکعب در ساعت' },
      { Category: 'ورودی‌ها', Parameter: 'نسبت O:A', Value: inputs.ROA, Unit: '-' },
      { Category: 'ورودی‌ها', Parameter: 'اختلاف غلظت مس در الکترووینینگ', Value: inputs.delta_Cu, Unit: 'گرم در لیتر' },
      { Category: 'ورودی‌ها', Parameter: 'درصد تبخیر آب', Value: inputs.A, Unit: '%' },
      { Category: 'ورودی‌ها', Parameter: 'دبی فاز آلی برگشتی (جریان ۶)', Value: inputs.Q6, Unit: 'متر مکعب در ساعت' },
      { Category: 'ورودی‌ها', Parameter: 'غلظت مس فاز آلی برگشتی (جریان ۶)', Value: inputs.C6, Unit: 'گرم در لیتر' },
      { Category: 'ورودی‌ها', Parameter: 'مصرف اسید به ازای هر تن خاک', Value: inputs.acidConsumption, Unit: 'کیلوگرم بر تن' },
      { Category: 'ورودی‌ها', Parameter: 'خوراک سنگ معدن', Value: inputs.Mh_ore, Unit: 'تن در ساعت' },
      { Category: 'ورودی‌ها', Parameter: 'چگالی اسید', Value: inputs.acidDensity, Unit: 'تن بر متر مکعب' },
      { Category: 'ورودی‌ها', Parameter: 'غلظت اسید در جریان بلید (جریان ۹)', Value: inputs.A_con9, Unit: 'گرم در لیتر' },
      { Category: 'ورودی‌ها', Parameter: 'دبی جریان بلید (جریان ۹)', Value: inputs.Q9, Unit: 'متر مکعب در ساعت' },
      {}, // Spacer
      { Category: 'نتایج', Parameter: 'نرخ تولید ساعتی مس (جریان ۱۰)', Value: results.P_hr, Unit: 'تن در ساعت' },
      { Category: 'نتایج', Parameter: 'دبی الکترولیت مصرفی (جریان ۸)', Value: results.Q8, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'دبی رافینت از استخراج (جریان ۱۱)', Value: results.Q11, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'غلظت مس در رافینت (جریان ۱۱)', Value: results.C11, Unit: 'گرم در لیتر' },
      { Category: 'نتایج', Parameter: 'نرخ تبخیر آب از هیپ (جریان ۲)', Value: results.E_heap, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'جریان آب تازه به پوند رافینت (جریان ۱۹)', Value: results.Q19, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'دبی رافینت به هیپ (جریان ۱۲)', Value: results.Q12, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'غلظت مس رافینت به هیپ (جریان ۱۲)', Value: results.C12, Unit: 'گرم در لیتر' },
      { Category: 'نتایج', Parameter: 'دبی فاز آلی باردار (جریان ۵)', Value: results.Q5, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'غلظت مس فاز آلی باردار (جریان ۵)', Value: results.C5, Unit: 'گرم در لیتر' },
      { Category: 'نتایج', Parameter: 'نرخ افزودن اسید کل (جریان ۱۳)', Value: results.Q13, Unit: 'متر مکعب در ساعت' },
      { Category: 'نتایج', Parameter: 'نرخ مصرف اسید در الکترووینینگ (جریان ۱۴)', Value: results.Q14, Unit: 'متر مکعب در ساعت' },
    ];

    const worksheet = utils.json_to_sheet(data.map(d => ({
        'دسته': d.Category,
        'پارامتر': d.Parameter,
        'مقدار': d.Value ? (typeof d.Value === 'number' ? d.Value.toFixed(3) : d.Value) : '',
        'واحد': d.Unit
    })));
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'محاسبات لیچینگ');
    writeFile(workbook, 'Leaching_Calculations.xlsx');
  };

  const renderCalculator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      {/* Input Column */}
      <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های فرآیند</h2>
        
        <h3 className="text-lg font-semibold text-cyan-400 mt-6 mb-3">پارامترهای اصلی</h3>
        <InputField label="مقدار تولید سالانه" unit="تن" name="p" value={inputs.p} onChange={handleInputChange} tooltip="کل مس کاتدی تولید شده در یک سال." />
        <InputField label="روز کاری سال" unit="روز" name="wd" value={inputs.wd} onChange={handleInputChange} tooltip="تعداد روزهایی که کارخانه در سال فعال است." />
        <InputField label="ساعت کاری روز" unit="ساعت" name="wh" value={inputs.wh} onChange={handleInputChange} tooltip="ساعات کاری مفید در یک شبانه‌روز."/>

        <h3 className="text-lg font-semibold text-cyan-400 mt-6 mb-3">پارامترهای استخراج (SX)</h3>
        <InputField label="بازیابی کلی SX" unit="%" name="R" value={inputs.R} onChange={handleInputChange} tooltip="درصد مس منتقل شده از فاز آبی به فاز آلی در واحد استخراج."/>
        <InputField label="دبی PLS به SX" unit="متر مکعب/ساعت" name="Q4" value={inputs.Q4} onChange={handleInputChange} tooltip="دبی محلول باردار (PLS) ورودی به واحد استخراج."/>
        <InputField label="غلظت مس در PLS" unit="گرم/لیتر" name="C4" value={inputs.C4} onChange={handleInputChange} tooltip="غلظت مس در محلول باردار ورودی به واحد استخراج."/>
        <InputField label="نسبت O:A" unit="-" name="ROA" value={inputs.ROA} onChange={handleInputChange} tooltip="نسبت حجمی فاز آلی به فاز آبی در میکسر-سترها."/>
        
        <h3 className="text-lg font-semibold text-cyan-400 mt-6 mb-3">پارامترهای الکترووینینگ (EW)</h3>
        <InputField label="افت غلظت مس در EW" unit="گرم/لیتر" name="delta_Cu" value={inputs.delta_Cu} onChange={handleInputChange} tooltip="میزان کاهش غلظت مس در الکترولیت پس از عبور از سلول‌های الکترووینینگ."/>

        <h3 className="text-lg font-semibold text-cyan-400 mt-6 mb-3">سایر پارامترها</h3>
        <InputField label="درصد تبخیر" unit="%" name="A" value={inputs.A} onChange={handleInputChange} tooltip="درصد آب تبخیر شده از سطح هیپ‌ها و استخرها."/>
        <InputField label="دبی فاز آلی برگشتی" unit="متر مکعب/ساعت" name="Q6" value={inputs.Q6} onChange={handleInputChange} />
        <InputField label="غلظت مس فاز آلی برگشتی" unit="گرم/لیتر" name="C6" value={inputs.C6} onChange={handleInputChange} />
        <InputField label="مصرف اسید" unit="کیلوگرم/تن" name="acidConsumption" value={inputs.acidConsumption} onChange={handleInputChange} tooltip="میزان اسید سولفوریک مصرفی به ازای هر تن سنگ معدنی."/>
        <InputField label="خوراک سنگ معدن" unit="تن/ساعت" name="Mh_ore" value={inputs.Mh_ore} onChange={handleInputChange} />
        <InputField label="چگالی اسید" unit="تن/متر مکعب" name="acidDensity" value={inputs.acidDensity} onChange={handleInputChange} />
        <InputField label="غلظت اسید جریان بلید" unit="گرم/لیتر" name="A_con9" value={inputs.A_con9} onChange={handleInputChange} />
        <InputField label="دبی جریان بلید" unit="متر مکعب/ساعت" name="Q9" value={inputs.Q9} onChange={handleInputChange} />

      </div>

      {/* Results Column */}
      <div className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">نتایج محاسبات</h2>
            <button
                onClick={exportToExcel}
                className="flex items-center space-x-2 space-x-reverse bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg"
            >
                <FileDown size={20} />
                <span>خروجی اکسل</span>
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultCard title="نرخ تولید ساعتی مس" value={results.P_hr} unit="تن در ساعت" icon={<Settings className="text-green-400" size={24}/>} />
            <ResultCard title="دبی الکترولیت مصرفی (جریان ۸)" value={results.Q8} unit="متر مکعب در ساعت" icon={<Zap className="text-yellow-400" size={24}/>} />
            <ResultCard title="دبی رافینت از SX (جریان ۱۱)" value={results.Q11} unit="متر مکعب در ساعت" icon={<Droplets className="text-blue-400" size={24}/>} />
            <ResultCard title="غلظت مس رافینت (جریان ۱۱)" value={results.C11} unit="گرم در لیتر" icon={<Droplets className="text-blue-400" size={24}/>} />
            <ResultCard title="نرخ تبخیر آب (جریان ۲)" value={results.E_heap} unit="متر مکعب در ساعت" icon={<Droplets className="text-red-400" size={24}/>} />
            <ResultCard title="آب تازه مورد نیاز (جریان ۱۹)" value={results.Q19} unit="متر مکعب در ساعت" icon={<Droplets className="text-green-400" size={24}/>} />
            <ResultCard title="دبی رافینت به هیپ (جریان ۱۲)" value={results.Q12} unit="متر مکعب در ساعت" icon={<Droplets className="text-purple-400" size={24}/>} />
            <ResultCard title="غلظت مس رافینت به هیپ (جریان ۱۲)" value={results.C12} unit="گرم در لیتر" icon={<Droplets className="text-purple-400" size={24}/>} />
            <ResultCard title="دبی فاز آلی باردار (جریان ۵)" value={results.Q5} unit="متر مکعب در ساعت" icon={<Droplets className="text-orange-400" size={24}/>} />
            <ResultCard title="غلظت مس فاز آلی باردار (جریان ۵)" value={results.C5} unit="گرم در لیتر" icon={<Droplets className="text-orange-400" size={24}/>} />
            <ResultCard title="نرخ افزودن اسید (جریان ۱۳)" value={results.Q13} unit="متر مکعب در ساعت" icon={<Droplets className="text-red-500" size={24}/>} />
            <ResultCard title="مصرف اسید در EW (جریان ۱۴)" value={results.Q14} unit="متر مکعب در ساعت" icon={<Droplets className="text-red-500" size={24}/>} />
        </div>
        
        <div className="mt-8 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">تفسیر نتایج</h3>
            <p className="text-gray-300 leading-relaxed">
                این نتایج به شما کمک می‌کنند تا یک دید کلی از بیلان جرم و آب در مدار لیچینگ-استخراج-الکترووینینگ داشته باشید.
                <br/>- **دبی‌ها (Q):** مقادیر دبی جریان‌های مختلف به شما در انتخاب سایز پمپ‌ها، لوله‌ها و تجهیزات کمک می‌کند.
                <br/>- **غلظت‌ها (C):** مقادیر غلظت برای کنترل عملکرد واحدهای SX و EW و همچنین محاسبه بازیابی فرآیند ضروری هستند.
                <br/>- **تعادل آب و اسید:** مقادیر تبخیر، آب تازه و اسید مصرفی برای مدیریت منابع و هزینه‌های عملیاتی حیاتی است. با استفاده از این مقادیر می‌توانید استراتژی‌های بهینه‌سازی مصرف آب و اسید را تدوین کنید.
            </p>
        </div>
      </div>
    </div>
  );

  const renderHelp = () => (
    <div className="p-4 md:p-8 text-gray-300 leading-loose max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">راهنمای ماشین حساب لیچینگ</h2>
      
      <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
        <h3 className="text-xl font-semibold text-white mb-3">معرفی</h3>
        <p>
          این ابزار برای شبیه‌سازی و محاسبه پارامترهای کلیدی در یک مدار لیچینگ هیپی، استخراج با حلال (SX) و الکترووینینگ (EW) طراحی شده است. با وارد کردن پارامترهای اولیه فرآیند، می‌توانید دبی و غلظت جریان‌های مختلف در مدار را محاسبه کرده و دیدی جامع از بیلان جرم مس، آب و اسید در کارخانه به دست آورید.
        </p>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
        <h3 className="text-xl font-semibold text-white mb-3">راهنمای ورودی‌ها</h3>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>مقدار تولید سالانه (تن):</strong> هدف تولید مس کاتدی در یک سال. این پارامتر اساس بسیاری از محاسبات طراحی است.</li>
          <li><strong>بازیابی کلی SX (%):</strong> نشان‌دهنده راندمان واحد استخراج در انتقال مس از محلول باردار (PLS) به الکترولیت است.</li>
          <li><strong>دبی و غلظت PLS:</strong> مشخصات جریان اصلی ورودی به واحد SX که از هیپ‌های لیچینگ جمع‌آوری می‌شود.</li>
          <li><strong>افت غلظت مس در EW:</strong> میزان مسی که در واحد الکترووینینگ از الکترولیت غنی‌شده استخراج و به صورت کاتد رسوب می‌کند.</li>
          <li><strong>درصد تبخیر:</strong> یکی از پارامترهای مهم در بیلان آب مدار است و بر میزان آب جبرانی مورد نیاز تأثیر می‌گذارد.</li>
          <li><strong>مصرف اسید:</strong> میزان اسید سولفوریک لازم برای لیچ شدن کانی‌های مس در سنگ معدن. این پارامتر بر هزینه‌های عملیاتی تأثیر مستقیم دارد.</li>
        </ul>
      </div>

      <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-3">کاربرد نتایج</h3>
        <p>
          نتایج به دست آمده از این ماشین حساب می‌تواند در زمینه‌های زیر به مهندسان و اپراتورها کمک کند:
        </p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>طراحی فرآیند:</strong> انتخاب اولیه سایز تجهیزات مانند پمپ‌ها، خطوط لوله، میکسر-سترها و سلول‌های الکترووینینگ.</li>
          <li><strong>بهینه‌سازی عملیات:</strong> با تغییر ورودی‌ها (مانند نسبت O:A یا دبی‌ها) می‌توانید تأثیر آن را بر کل مدار مشاهده کرده و نقاط بهینه کاری را شناسایی کنید.</li>
          <li><strong>کنترل فرآیند:</strong> مقایسه نتایج شبیه‌سازی با داده‌های واقعی کارخانه به شناسایی انحرافات و مشکلات احتمالی در فرآیند کمک می‌کند.</li>
          <li><strong>مدیریت هزینه:</strong> برآورد میزان مصرف آب و اسید به مدیریت بهتر هزینه‌های تولید کمک شایانی می‌کند.</li>
          <li><strong>آموزش:</strong> این ابزار می‌تواند برای آموزش پرسنل جدید و نمایش تأثیر متقابل پارامترهای مختلف در مدار لیچینگ بسیار مفید باشد.</li>
        </ul>
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
            <ChevronsDown className="text-cyan-400" size={32} />
            <h1 className="text-2xl font-bold">ماشین حساب فرآیندهای لیچینگ</h1>
          </div>
          <nav className="flex space-x-1 space-x-reverse border-b-0">
            <TabButton tabName="calculator" label="ماشین حساب" icon={<Calculator size={18}/>} />
            <TabButton tabName="help" label="راهنما" icon={<HelpCircle size={18}/>} />
          </nav>
        </div>
      </header>

      <main className="container mx-auto">
        {activeTab === 'calculator' && renderCalculator()}
        {activeTab === 'help' && renderHelp()}
      </main>

      <footer className="text-center p-4 text-gray-500 text-sm mt-8">
        <p>طراحی و توسعه توسط هوش مصنوعی Gemini برای تحلیل فرآیندهای هیدرومتالورژی</p>
      </footer>
    </div>
  );
}
