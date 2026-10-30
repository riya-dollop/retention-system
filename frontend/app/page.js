'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
        if (selectId) {
          const match = data.find((c) => c.id === selectId);
          if (match) setSelectedCustomer(match);
        } else if (!selectedCustomer) {
          setSelectedCustomer(data[0]);
        } else {
          const currentMatch = data.find((c) => c.id === selectedCustomer.id);
          if (currentMatch) setSelectedCustomer(currentMatch);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  }, [selectedCustomer]);

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
      return res;
    } catch (err) {
      alert(`Advance clock error: ${err.message}`);
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
      alert('Database successfully reset to initial seed data!');
    } catch (err) {
      alert(`Reset error: ${err.message}`);
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
    } catch (err) {
      alert(`Webhook error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle recording payment
  const handleRecordPayment = async (paymentData) => {
    const res = await api.recordPayment(paymentData);
    await loadCustomers(selectedCustomer?.id);
    if (selectedCustomer?.id) {
      await loadMessages(selectedCustomer.id);
    }
    return res;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      {/* Top Simulated Fake Clock Fast-Forward Bar */}
      <ClockController
        currentDate={currentDate}
        onAdvance={handleAdvanceClock}
        onReset={handleReset}
        loading={loading}
      />

      {/* Main Workspace (Customer List + Chat Panel) */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left Customer Directory */}
        <CustomerSelector
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(cust) => setSelectedCustomer(cust)}
        />

        {/* Right WhatsApp Chat Interface */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatWindow
            customer={selectedCustomer}
            messages={messages}
            onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          />

          <QuickReplyBar
            customer={selectedCustomer}
            onSendReply={handleSendReply}
            loading={loading}
          />
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
