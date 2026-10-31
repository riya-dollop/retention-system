'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import ClockController from '../components/ClockController';
import CustomerSelector from '../components/CustomerSelector';
import ChatWindow from '../components/ChatWindow';
import QuickReplyBar from '../components/QuickReplyBar';
import RecordPaymentModal from '../components/RecordPaymentModal';

export default function MockWhatsAppPage() {
  const [currentDate, setCurrentDate] = useState('2026-10-20');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Load clock date
  const loadClock = useCallback(async () => {
    try {
      const data = await api.getClock();
      setCurrentDate(data.currentDate);
    } catch (err) {
      console.error('Failed to load clock:', err);
    }
  }, []);

  // Load customer list
  const loadCustomers = useCallback(async (selectId = null) => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);

      if (data.length > 0) {
        setSelectedCustomer((prev) => {
          if (selectId) {
            return data.find((c) => c.id === selectId) || prev || data[0];
          }
          if (!prev) return data[0];
          return data.find((c) => c.id === prev.id) || prev || data[0];
        });
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }, []);

  // Load messages for currently selected customer
  const loadMessages = useCallback(async (customerId) => {
    if (!customerId) return;
    try {
      const msgs = await api.getCustomerMessages(customerId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  useEffect(() => {
    loadClock();
    loadCustomers();
  }, [loadClock, loadCustomers]);

  useEffect(() => {
    if (selectedCustomer?.id) {
      loadMessages(selectedCustomer.id);
    }
  }, [selectedCustomer?.id, loadMessages]);

  // Handle advancing clock
  const handleAdvanceClock = async (days) => {
    setLoading(true);
    try {
      const res = await api.advanceClock(days);
      setCurrentDate(res.currentDate);
      await loadCustomers(selectedCustomer?.id);
      if (selectedCustomer?.id) {
        await loadMessages(selectedCustomer.id);
      }
      toast.success(`Fast-forwarded ${days} day(s) → ${res.currentDate}`);
      return res;
    } catch (err: any) {
      toast.error(`Advance clock error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle database reset
  const handleReset = async () => {
    if (!confirm('Reset database to initial baseline seed state?')) return;
    setLoading(true);
    try {
      const res = await api.resetDatabase();
      setCurrentDate(res.clockDate || '2026-10-20');
      await loadCustomers();
      if (customers[0]?.id) {
        await loadMessages(customers[0].id);
      }
      toast.success('Database successfully reset to initial seed data!');
    } catch (err: any) {
      toast.error(`Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle simulated incoming reply from customer (Webhook)
  const handleSendReply = async (text) => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await api.sendWebhookReply({
        customer_id: selectedCustomer.id,
        text,
      });

      // Reload chat feed and customer state immediately
      await loadMessages(selectedCustomer.id);
      await loadCustomers(selectedCustomer.id);
      toast.success(`Simulated reply sent: "${text.substring(0, 24)}${text.length > 24 ? '...' : ''}"`);
    } catch (err: any) {
      toast.error(`Webhook error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle recording payment
  const handleRecordPayment = async (paymentData) => {
    try {
      const res = await api.recordPayment(paymentData);
      await loadCustomers(selectedCustomer?.id);
      if (selectedCustomer?.id) {
        await loadMessages(selectedCustomer.id);
      }
      toast.success(`Payment of ₹${paymentData.amount} recorded!`);
      return res;
    } catch (err: any) {
      toast.error(`Payment failed: ${err.message}`);
      throw err;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] min-h-0 overflow-hidden">
      {/* Top Simulated Fake Clock Fast-Forward Bar */}
      <div className="flex-shrink-0">
        <ClockController
          currentDate={currentDate}
          onAdvance={handleAdvanceClock}
          onReset={handleReset}
          loading={loading}
        />
      </div>

      {/* Main Workspace (Customer List + Chat Panel) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 h-full overflow-hidden">
        {/* Left Customer Directory */}
        <div className={`h-full min-h-0 ${mobileView === 'list' ? 'flex flex-col w-full md:w-80 lg:w-96 flex-shrink-0' : 'hidden md:flex md:flex-col md:w-80 lg:w-96 flex-shrink-0'}`}>
          <CustomerSelector
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={(cust) => {
              setSelectedCustomer(cust);
              setMobileView('chat');
            }}
          />
        </div>

        {/* Right WhatsApp Chat Interface */}
        <div className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ChatWindow
              customer={selectedCustomer}
              messages={messages}
              onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
              onQuickAction={handleSendReply}
              onBackToList={() => setMobileView('list')}
            />
          </div>

          <div className="flex-shrink-0">
            <QuickReplyBar
              customer={selectedCustomer}
              onSendReply={handleSendReply}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        customer={selectedCustomer}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmitPayment={handleRecordPayment}
        loading={loading}
      />
    </div>
  );
}

