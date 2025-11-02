import React, { useState, useEffect } from 'react';
import { Button, Card, Loading } from '@/components/ui';
import { jiraService } from '@/services/jira.service';
import { useUIStore } from '@/store/ui.store';
import EmailPreviewModal from './EmailPreviewModal';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecipientInfo {
  email: string;
  name: string;
  actionCount: number;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose }) => {
  const [reportingTarget, setReportingTarget] = useState<'' | 'action_responsible' | 'clevel'>('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [recipientList, setRecipientList] = useState<RecipientInfo[]>([]); // For "To:" dropdown (hardcoded test data)
  const [filterList, setFilterList] = useState<RecipientInfo[]>([]); // For "Filter" dropdown (real data)
  const [filterValue, setFilterValue] = useState<string>('all');
  const [bulkEmail, setBulkEmail] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const { addNotification } = useUIStore();
  
  // Email Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReportingTarget('');
      setSelectedRecipient('');
      setRecipientList([]);
      setFilterList([]);
      setFilterValue('all');
      setBulkEmail(false);
      // setSendingProgress and setIsCancelling not needed in demo mode
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen]);

  // Fetch recipient lists when reporting target changes
  useEffect(() => {
    const fetchRecipients = async () => {
      if (!reportingTarget) {
        setRecipientList([]);
        setFilterList([]);
        return;
      }

      try {
        setIsLoadingRecipients(true);
        
        if (reportingTarget === 'action_responsible') {
          // Fetch hardcoded list for "To:" dropdown (test data)
          const recipientsResponse = await jiraService.getActionResponsibleList();
          
          // Fetch full list for "Filter" dropdown (real data from database)
          const filterResponse = await jiraService.getAllActionResponsibleList();
          
          if (recipientsResponse.success && recipientsResponse.data) {
            setRecipientList(recipientsResponse.data);
            // Auto-select first recipient if only one exists
            if (recipientsResponse.data.length === 1) {
              setSelectedRecipient(recipientsResponse.data[0].email);
            }
          }
          
          if (filterResponse.success && filterResponse.data) {
            console.log('📧 Filter list data from backend:', filterResponse.data);
            setFilterList(filterResponse.data);
          }
        } else {
          // For C-Level, use same list for both (hardcoded)
          const response = await jiraService.getCLevelList();
          
          if (response.success && response.data) {
            setRecipientList(response.data);
            setFilterList(response.data);
            // Auto-select first recipient if only one exists
            if (response.data.length === 1) {
              setSelectedRecipient(response.data[0].email);
            }
          }
        }
      } catch (error) {
        addNotification({
          type: 'error',
          message: 'Failed to load recipient list',
        });
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    fetchRecipients();
  }, [reportingTarget, addNotification]);

  // Prepare email data with action tables and financial impact
  // NOT USED IN DEMO MODE - Email preview doesn't need this
  /* 
  const prepareEmailData = async (recipientEmail: string, recipientName: string, filterEmail?: string) => {
    // ... code commented out for demo mode ...
  };
  */

  const handleSendEmail = async () => {
    // Validate: both reporting target and recipient are always required
    if (!reportingTarget || !selectedRecipient) {
      addNotification({
        type: 'warning',
        message: 'Please select a reporting target and recipient',
      });
      return;
    }

    // 🎯 DEMO MODE: Show preview modal instead of sending
    const recipients = bulkEmail 
      ? (filterValue === 'all' ? filterList : filterList.filter(r => r.email === filterValue))
      : [recipientList.find(r => r.email === selectedRecipient)].filter(Boolean) as RecipientInfo[];
    
    setPreviewData({
      to: bulkEmail ? recipients.map(r => r.email) : [selectedRecipient],
      reportingTarget,
      auditYear: '2024+',
      bulkEmail,
      subject: `Action Status Report - ${reportingTarget === 'action_responsible' ? 'Action Responsible' : 'C-Level'}`
    });
    setIsPreviewOpen(true);
    // Don't close email modal yet - wait for preview to close
    return;

    // 📧 ORIGINAL EMAIL SENDING CODE (disabled in demo mode)
    /*
    try {
      setIsSending(true);
      setIsCancelling(false);

      if (bulkEmail) {
        // Bulk email mode - send multiple emails with different data
        // All emails go to the same address (selectedRecipient) for testing
        // But each email contains different user's action data
        const recipients = filterValue === 'all' 
          ? filterList 
          : filterList.filter(r => r.email === filterValue);

        if (recipients.length === 0) {
          addNotification({
            type: 'warning',
            message: 'No recipients selected',
          });
          return;
        }

        // Confirm bulk send
        if (!confirm(`Send ${recipients.length} separate personalized emails to ${selectedRecipient}?\n\nEach email will contain a different Action Responsible's data for testing.`)) {
          setIsSending(false);
          return;
        }

        setSendingProgress({ current: 0, total: recipients.length });
        
        let successCount = 0;
        let errorCount = 0;
        const failedRecipients: string[] = [];

        for (let i = 0; i < recipients.length; i++) {
          if (isCancelling) {
            addNotification({
              type: 'info',
              message: `Cancelled. Sent ${successCount} of ${recipients.length} emails`,
            });
            break;
          }

          setSendingProgress({ current: i + 1, total: recipients.length });
          const recipient = recipients[i];

          if (!recipient) {
            errorCount++;
            continue;
          }

          try {
            console.log(`📧 Sending email ${i + 1}/${recipients.length} for ${recipient.name}'s data to ${selectedRecipient}...`);
            
            // Prepare email data with action tables
            // Email goes to selectedRecipient (To: field) but contains recipient's data
            const emailPayload = await prepareEmailData(
              selectedRecipient,  // To: address (test email - same for all)
              recipient.name,     // Recipient name (whose data is shown)
              recipient.email     // Filter: use this person's email for their action data
            );
            
            // Send email with prepared data
            await jiraService.sendEmail(emailPayload);
            successCount++;
            console.log(`✅ Email sent successfully with ${recipient.name}'s data`);
          } catch (error) {
            console.error(`❌ Failed to send email for ${recipient.name}:`, error);
            errorCount++;
            failedRecipients.push(recipient.name);
          }

          // Small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!isCancelling) {
          const message = successCount > 0 
            ? `Successfully sent ${successCount} of ${recipients.length} emails to ${selectedRecipient}${errorCount > 0 ? `\n\nFailed for: ${failedRecipients.join(', ')}` : ''}`
            : 'Failed to send any emails';
            
          addNotification({
            type: successCount > 0 ? 'success' : 'error',
            message,
          });
          onClose();
        }
      } else {
        // Single email mode
        const recipient = recipientList.find(r => r.email === selectedRecipient);
        const recipientName = recipient?.name || selectedRecipient;
        
        // Determine whose action data to fetch based on filter
        // If filter is 'all' or not set, use selectedRecipient
        // Otherwise, use the specific filtered email
        const actionDataEmail = (filterValue && filterValue !== 'all') ? filterValue : selectedRecipient;
        
        // Prepare email data with action tables
        const emailPayload = await prepareEmailData(
          selectedRecipient,  // To: address (test email)
          recipientName,      // Recipient name
          actionDataEmail     // Filter: whose action data to fetch
        );
        
        // Send email with prepared data
        await jiraService.sendEmail(emailPayload);
        
        addNotification({
          type: 'success',
          message: `Email sent successfully to ${selectedRecipient}`,
        });
        onClose();
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to send email',
      });
    } finally {
      setIsSending(false);
      setSendingProgress({ current: 0, total: 0 });
    }
    */
  };

  const handleCancel = () => {
    // In demo mode, just close the modal (no sending to cancel)
    onClose();
  };

  if (!isOpen) return null;

  // Check if preview button should be disabled
  const isPreviewDisabled = !reportingTarget || !selectedRecipient;
  const recipientTypeLabel = reportingTarget === 'action_responsible' ? 'Action Responsible' : 'C-Level';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
        <Card className="max-w-xl w-full max-h-[90vh] overflow-y-auto" variant="elevated">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Email Type - Fixed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Type:
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-700 font-medium">Use SendGrid Template</span>
            </div>
          </div>

          {/* Reporting Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <svg className="w-4 h-4 inline mr-1 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Select Reporting Target:
            </label>
            <select
              value={reportingTarget}
              onChange={(e) => {
                setReportingTarget(e.target.value as any);
                setSelectedRecipient('');
                setFilterValue('all');
                setBulkEmail(false);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Please select...</option>
              <option value="action_responsible">Action Responsible</option>
              {/* <option value="clevel">C-Level</option> */}
            </select>
          </div>

          {/* Recipient Selection */}
          {reportingTarget && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  To:
                </label>
                {isLoadingRecipients ? (
                  <div className="flex items-center justify-center py-6">
                    <Loading size="md" />
                  </div>
                ) : recipientList.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    No recipients found with open actions
                  </div>
                ) : (
                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select recipient...</option>
                    {recipientList.map((recipient) => (
                      <option key={recipient.email} value={recipient.email}>
                        {recipient.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Filter (for bulk email targeting) */}
              {filterList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <svg className="w-4 h-4 inline mr-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Filter by {recipientTypeLabel}:
                  </label>
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="all">All {recipientTypeLabel}s ({filterList.length} users)</option>
                    {filterList.map((recipient) => (
                      <option key={recipient.email} value={recipient.email}>
                        {recipient.name} ({recipient.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bulk Email Checkbox */}
              {filterList.length > 0 && (
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                  <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="bulkEmail"
                checked={bulkEmail}
                onChange={(e) => setBulkEmail(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="bulkEmail" className="text-sm font-medium text-gray-900 cursor-pointer">
                        <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send separate emails for each {recipientTypeLabel}'s data
              </label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        All emails will be sent to the address above, but each contains different user's data
                      </p>
                    </div>
                  </div>
            </div>
          )}
            </>
          )}

          {/* Info Box */}
          {reportingTarget && selectedRecipient && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                {bulkEmail ? `Each email to ${selectedRecipient} will include:` : 'Email will include:'}
              </p>
              <ul className="text-xs text-blue-700 mt-1.5 space-y-0.5 list-disc list-inside">
                <li>Dashboard report with audit findings</li>
                <li>Open and overdue actions tables</li>
                <li>Upcoming actions summary</li>
                <li>Financial impact data</li>
                {bulkEmail && <li className="font-semibold">✨ Different data for each selected user</li>}
              </ul>
            </div>
          )}

          {/* Sending Progress - Not used in demo mode */}

          {/* Action Buttons */}
          <div className="flex gap-2.5 justify-end pt-3 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSendEmail} 
              disabled={isPreviewDisabled}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Email
            </Button>
          </div>
        </div>
      </Card>
      </div>
      
      {/* Email Preview Modal */}
      {previewData && (
        <EmailPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewData(null);
            addNotification({
              type: 'success',
              message: '✅ Email preview viewed (Demo mode - no email sent)',
            });
            // Close the main email modal too
            onClose();
          }}
          emailData={previewData}
        />
      )}
    </>
  );
};

export default EmailModal;
