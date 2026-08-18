import React from 'react';
import { numberToWords } from '../../utils/numberToWords';
import { formatCurrency, formatDate } from '../../utils/permissions';
import { Icon } from '../ui';

interface StatementProps {
  type: 'customer' | 'supplier';
  entityName: string;
  entityAddress: string;
  entityPin?: string;
  transactions: {
    date: string;
    invoiceNo: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  startDate: string;
  endDate: string;
  currentBalance: number;
  onClose: () => void;
}

export default function StatementDocument({
  type,
  entityName,
  entityAddress,
  entityPin,
  transactions,
  startDate,
  endDate,
  currentBalance,
  onClose
}: StatementProps) {
  const isCustomer = type === 'customer';
  
  return (
    <div className="print-area bg-white text-black text-[12px] font-sans h-full overflow-y-auto w-full absolute inset-0 z-[100] print:z-auto">
      {/* Non-print header for the modal view */}
      <div className="no-print bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 shadow-md">
        <h2 className="font-bold">Print Preview: {isCustomer ? 'Customer' : 'Supplier'} Statement</h2>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center gap-2">
            <Icon name="printer" size={16} /> Print
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold">
            Close
          </button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto bg-white p-8 my-8 print:my-0 print:p-0 shadow-lg print:shadow-none border border-slate-200 print:border-none min-h-[1050px]">
        {/* Header Block */}
        <div className="flex items-center gap-4 border-b-2 border-[#00175a] pb-4 mb-4">
          <div className="w-20 h-20 border-4 border-[#00175a] flex items-center justify-center font-bold text-4xl text-[#00175a] rounded-sm shrink-0">
            P
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-[34px] font-black text-[#00175a] m-0 leading-tight uppercase tracking-wide">
              Pramukh Hardwaremart LTD
            </h1>
            <p className="text-[#b18128] font-bold text-sm tracking-widest mt-1 mb-1">
              BEST HARDWARE. STRONGER FUTURE.
            </p>
            <div className="bg-[#00175a] text-white py-1 px-4 text-xs font-bold inline-block rounded-sm tracking-widest">
              YOUR TRUSTED PARTNER FOR ALL HARDWARE SOLUTIONS
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex justify-between items-center text-[12px] font-bold text-[#00175a] mb-6 px-2">
          <div className="flex items-center gap-2">
            <Icon name="map-pin" size={14} />
            Jamboni, Annex, Eldoret - 30100, Kenya
          </div>
          <div className="flex items-center gap-2">
            <Icon name="phone" size={14} />
            Owner: Sagarbhai <span className="mx-2 text-slate-300">|</span> +254 719 188 886
          </div>
        </div>

        {/* Title */}
        <div className="text-center bg-[#f0f4f8] border border-[#00175a] py-2 mb-4">
          <h2 className="text-lg font-black text-[#00175a] uppercase m-0 tracking-widest">
            {isCustomer ? 'Customer' : 'Supplier'} Account Statement
          </h2>
        </div>

        {/* Dates */}
        <div className="flex justify-between gap-4 mb-4">
          <div className="flex-1 flex border border-[#00175a]">
            <div className="bg-[#f0f4f8] font-bold text-[#00175a] px-4 py-2 w-1/2 border-r border-[#00175a] flex items-center justify-center">STATEMENT DATE (1)</div>
            <div className="px-4 py-2 w-1/2 font-semibold text-center flex items-center justify-center">{formatDate(startDate)}</div>
          </div>
          <div className="flex-1 flex border border-[#00175a]">
            <div className="bg-[#f0f4f8] font-bold text-[#00175a] px-4 py-2 w-1/2 border-r border-[#00175a] flex items-center justify-center">STATEMENT DATE (2)</div>
            <div className="px-4 py-2 w-1/2 font-semibold text-center flex items-center justify-center">{formatDate(endDate)}</div>
          </div>
        </div>

        {/* Details Grids */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left Block */}
          <div className="border border-[#00175a] flex flex-col">
            <div className="bg-[#00175a] text-white text-center py-1.5 font-bold uppercase text-xs">
              {isCustomer ? 'SUPPLIER / OUR BUSINESS DETAILS' : 'CUSTOMER DETAILS (BILLED TO)'}
            </div>
            <div className="p-3 text-[11px] flex-1">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 w-24">Company Name</td>
                    <td className="py-1 px-2">:</td>
                    <td className="py-1 font-bold">{isCustomer ? 'PRAMUKH HARDWAREMART LTD' : entityName}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top">Address</td>
                    <td className="py-1 px-2 align-top">:</td>
                    <td className="py-1">
                      {isCustomer ? (
                        <>Jamboni, Annex,<br/>Eldoret - <span className="text-red-600 font-bold">30100</span>, Kenya</>
                      ) : entityAddress}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1">Phone</td>
                    <td className="py-1 px-2">:</td>
                    <td className="py-1">{isCustomer ? '+254 719 188 886' : 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Block */}
          <div className="border border-[#00175a] flex flex-col">
            <div className="bg-[#00175a] text-white text-center py-1.5 font-bold uppercase text-xs">
              {isCustomer ? 'CUSTOMER DETAILS (BILLED TO)' : 'SUPPLIER / OUR BUSINESS DETAILS'}
            </div>
            <div className="p-3 text-[11px] flex-1">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 w-24">Company Name</td>
                    <td className="py-1 px-2">:</td>
                    <td className="py-1 font-bold">{isCustomer ? entityName : 'PRAMUKH HARDWAREMART LTD'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 align-top">Address</td>
                    <td className="py-1 px-2 align-top">:</td>
                    <td className="py-1">
                      {isCustomer ? entityAddress : <>Jamboni, Annex,<br/>Eldoret - <span className="text-red-600 font-bold">30100</span>, Kenya</>}
                    </td>
                  </tr>
                  {entityPin && (
                    <tr>
                      <td className="py-1">PIN</td>
                      <td className="py-1 px-2">:</td>
                      <td className="py-1 uppercase">{entityPin}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Note */}
          <div className="border border-[#00175a] p-3 flex gap-3 items-start">
            <div className="mt-1"><Icon name="file-text" size={24} className="text-[#00175a]" /></div>
            <div>
              <div className="font-bold text-[#00175a] mb-1">PLEASE NOTE</div>
              <div className="text-[11px] text-slate-700 leading-snug">
                This is a statement of your account with us.<br/>
                Kindly review and contact us if you find any discrepancies.
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="border border-[#00175a] flex flex-col">
             <div className="bg-[#00175a] text-white py-1.5 px-3 font-bold uppercase text-xs">
              DELIVERY ADDRESS
            </div>
            <div className="p-3 text-[11px]">
               <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-0.5 w-24">Company Name</td>
                    <td className="py-0.5 px-2">:</td>
                    <td className="py-0.5 font-bold">{entityName}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">Address</td>
                    <td className="py-0.5 px-2 align-top">:</td>
                    <td className="py-0.5">{entityAddress}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="text-center font-bold text-[#00175a] mb-2 tracking-widest uppercase">
          ACCOUNT TRANSACTIONS
        </div>
        <table className="w-full border-collapse border border-[#00175a] mb-6 text-[11px]">
          <thead>
            <tr className="bg-[#00175a] text-white">
              <th className="border border-[#00175a] py-1.5 px-2 font-bold w-20">DATE</th>
              <th className="border border-[#00175a] py-1.5 px-2 font-bold w-24">INV NO</th>
              <th className="border border-[#00175a] py-1.5 px-2 font-bold text-left">DESCRIPTION</th>
              <th className="border border-[#00175a] py-1.5 px-2 font-bold text-right w-24">DEBIT AMOUNT</th>
              <th className="border border-[#00175a] py-1.5 px-2 font-bold text-right w-24">CREDIT AMOUNT</th>
              <th className="border border-[#00175a] py-1.5 px-2 font-bold text-right w-28">BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                <td className="border border-[#d1d5db] py-1.5 px-2 text-center">{tx.date}</td>
                <td className="border border-[#d1d5db] py-1.5 px-2 text-center">{tx.invoiceNo || '-'}</td>
                <td className="border border-[#d1d5db] py-1.5 px-2">{tx.description}</td>
                <td className="border border-[#d1d5db] py-1.5 px-2 text-right">{tx.debit ? Math.abs(tx.debit).toLocaleString() : '-'}</td>
                <td className="border border-[#d1d5db] py-1.5 px-2 text-right">{tx.credit ? Math.abs(tx.credit).toLocaleString() : '-'}</td>
                <td className="border border-[#d1d5db] py-1.5 px-2 text-right font-semibold">{tx.balance.toLocaleString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="border border-[#d1d5db] py-4 text-center text-slate-500 italic">
                  No transactions found in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Bottom Totals */}
        <div className="flex border border-[#00175a] mb-8">
          <div className="w-1/2 p-3 border-r border-[#00175a] flex flex-col justify-center bg-[#f0f4f8]">
             <div className="flex justify-between items-center font-bold text-[#00175a] text-sm">
                <span>CURRENT BALANCE (AS ON {formatDate(endDate)})</span>
                <span className="text-lg">{currentBalance.toLocaleString()}</span>
             </div>
          </div>
          <div className="w-1/2 p-3 bg-white">
            <div className="text-xs font-bold text-[#00175a] mb-1">AMOUNT IN WORDS:</div>
            <div className="italic text-[11.5px] font-medium leading-snug">
              {numberToWords(Math.abs(currentBalance))}
              {currentBalance < 0 ? ' (Credit)' : ''}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#00175a] text-white text-center py-4 rounded-sm mt-auto">
          <div className="text-xs mb-1 tracking-wide">Thank you for your continued support and trust in us.</div>
          <div className="text-[#b18128] font-bold text-xs tracking-widest">BEST HARDWARE. STRONGER FUTURE.</div>
        </div>

      </div>
    </div>
  );
}
