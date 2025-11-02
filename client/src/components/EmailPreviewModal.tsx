import React from 'react';
import { Button } from '@/components/ui';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailData: {
    to: string[];
    subject?: string;
    reportingTarget?: string;
    auditYear?: string;
    bulkEmail?: boolean;
  };
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, onClose, emailData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">📧 Email Preview</h2>
              <p className="text-sm text-cyan-100">Demo Mode - No Actual Email Sent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Alert Banner */}
        <div className="mx-6 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-900">Demo Mode Notice</p>
            <p className="text-sm text-amber-700 mt-1">
              This is a <strong>demonstration version</strong>. No email server (SendGrid) is configured, so <strong>no actual email will be sent</strong>.
              This preview shows how the email would appear if this were a production environment.
            </p>
          </div>
        </div>

        {/* Email Content Preview */}
        <div className="p-6 space-y-4">
          {/* Email Envelope */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-gray-600 min-w-[80px]">To:</span>
              <div className="flex-1">
                {emailData.to && emailData.to.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {emailData.to.map((email, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {email}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 italic">No recipients selected</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Subject:</span>
              <span className="text-sm text-gray-800 font-medium">
                {emailData.subject || `Action Status Report - ${emailData.reportingTarget || 'N/A'}`}
              </span>
            </div>

            {emailData.reportingTarget && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Type:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {emailData.reportingTarget === 'action_responsible' ? '📊 Action Responsible' : '👔 C-Level Report'}
                </span>
              </div>
            )}

            {emailData.auditYear && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Filter:</span>
                <span className="text-sm text-gray-800">Year: {emailData.auditYear}</span>
              </div>
            )}

            {emailData.bulkEmail && (
              <div className="flex items-start gap-3">
                <span className="text-sm font-semibold text-gray-600 min-w-[80px]">Mode:</span>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">Bulk Send (personalized for each recipient)</span>
                </div>
              </div>
            )}
          </div>

          {/* Email Body Preview */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Email Body Preview</p>
            </div>
            <div className="p-6 bg-white">
              <div className="space-y-6">
                <p className="text-gray-800">Dear Recipient,</p>
                <p className="text-gray-800">
                  This email contains your action status report for the audit period <strong>{emailData.auditYear || '2024+'}</strong>.
                </p>

                {/* Status Distribution Chart Preview */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Status Distribution Chart
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-100 border border-green-300 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-green-700">28</div>
                      <div className="text-xs text-green-600 mt-1">Completed</div>
                    </div>
                    <div className="bg-blue-100 border border-blue-300 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-blue-700">15</div>
                      <div className="text-xs text-blue-600 mt-1">Open</div>
                    </div>
                    <div className="bg-red-100 border border-red-300 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-red-700">6</div>
                      <div className="text-xs text-red-600 mt-1">Overdue</div>
                    </div>
                    <div className="bg-purple-100 border border-purple-300 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-purple-700">3</div>
                      <div className="text-xs text-purple-600 mt-1">Risk Accepted</div>
                    </div>
                  </div>
                </div>

                {/* Overdue Actions Table Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-3 py-2 border-b border-red-200">
                    <h3 className="text-sm font-semibold text-red-900 flex items-center gap-2">
                      ⚠️ Overdue Actions (6)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Due Date</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Days Past</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">FIND-2024-0042: Process improvement needed</td>
                          <td className="px-3 py-2 text-gray-600">2024-09-15</td>
                          <td className="px-3 py-2"><span className="text-red-600 font-semibold">-47 days</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">FIND-2024-0038: Control weakness identified</td>
                          <td className="px-3 py-2 text-gray-600">2024-10-01</td>
                          <td className="px-3 py-2"><span className="text-red-600 font-semibold">-31 days</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">FIND-2024-0029: Documentation gap</td>
                          <td className="px-3 py-2 text-gray-600">2024-10-10</td>
                          <td className="px-3 py-2"><span className="text-red-600 font-semibold">-22 days</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 text-center border-t">
                    Showing 3 of 6 overdue actions
                  </div>
                </div>

                {/* Upcoming Actions Table Preview */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-3 py-2 border-b border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      📅 Upcoming Actions (15)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Due Date</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Days Until</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">FIND-2025-0012: IT Security Assessment</td>
                          <td className="px-3 py-2 text-gray-600">2025-11-10</td>
                          <td className="px-3 py-2"><span className="text-yellow-600 font-semibold">9 days</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">FIND-2025-0018: Compliance review</td>
                          <td className="px-3 py-2 text-gray-600">2025-11-15</td>
                          <td className="px-3 py-2"><span className="text-green-600 font-semibold">14 days</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-800">FIND-2025-0024: Risk assessment update</td>
                          <td className="px-3 py-2 text-gray-600">2025-11-25</td>
                          <td className="px-3 py-2"><span className="text-green-600 font-semibold">24 days</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 text-center border-t">
                    Showing 3 of 15 upcoming actions
                  </div>
                </div>

                {/* Financial Impact Summary */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Financial Impact Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">€2.4M</div>
                      <div className="text-xs text-green-600">Open Actions Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-700">€850K</div>
                      <div className="text-xs text-red-600">Overdue Impact</div>
                    </div>
                  </div>
                </div>

                {/* Risk Accepted Items */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-purple-50 px-3 py-2 border-b border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                      ⚡ Risk Accepted Items (3)
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1"></span>
                      <span className="text-gray-700">FIND-2024-0056: Legacy system upgrade - Risk accepted until Q2 2025</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1"></span>
                      <span className="text-gray-700">FIND-2024-0062: Third-party vendor assessment - Risk accepted</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mt-1"></span>
                      <span className="text-gray-700">FIND-2024-0071: Manual process automation - Cost-benefit analysis pending</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-800">
                  Please review the attached information and take necessary actions on any overdue items.
                </p>
                <p className="text-gray-600 text-sm mt-6">
                  Best regards,<br />
                  Demo Company Audit Team
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">In Production Mode:</p>
                <p>This email would be sent via SendGrid with professionally formatted HTML templates, including charts, tables, and full audit data.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            ✅ Email preview generated successfully
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-700"
            >
              Close Preview
            </Button>
            <Button
              variant="primary"
              onClick={onClose}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Understood
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;

