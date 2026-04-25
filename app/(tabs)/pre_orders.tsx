import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';

type OrderStatus = 'Pending' | 'Ready' | 'Done';

type OrderItem = {
  name: string;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  time: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
};

const INITIAL_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: '#001',
    customerName: 'Sarah L.',
    time: '11:15 AM',
    status: 'Pending',
    items: [
      { name: 'Iced Matcha Latte', quantity: 2 },
      { name: 'Mochi Donut', quantity: 1 },
    ],
    total: 18,
  },
  {
    id: '2',
    orderNumber: '#002',
    customerName: 'James K.',
    time: '11:22 AM',
    status: 'Pending',
    items: [
      { name: 'Hot Matcha Latte', quantity: 1 },
      { name: 'Matcha Cookie', quantity: 2 },
    ],
    total: 14,
  },
  {
    id: '3',
    orderNumber: '#003',
    customerName: 'Emily R.',
    time: '11:30 AM',
    status: 'Pending',
    items: [
      { name: 'Iced Matcha Latte', quantity: 1 },
    ],
    total: 6,
  },
  {
    id: '4',
    orderNumber: '#004',
    customerName: 'Mike T.',
    time: '11:45 AM',
    status: 'Ready',
    items: [
      { name: 'Matcha Frappe', quantity: 1 },
      { name: 'Mochi Donut', quantity: 2 },
    ],
    total: 13,
  },
  {
    id: '5',
    orderNumber: '#005',
    customerName: 'Anna W.',
    time: '12:00 PM',
    status: 'Done',
    items: [
      { name: 'Hot Matcha Latte', quantity: 1 },
    ],
    total: 6,
  },
];

type FilterTab = 'All' | 'Pending' | 'Ready' | 'Done';

const STATUS_BADGE_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  Pending: { bg: '#FFF1AD', text: '#f59e0b' },
  Ready: { bg: '#dbeafe', text: '#3b82f6' },
  Done: { bg: '#f3f4f6', text: '#9ca3af' },
};

export default function PreOrders() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');

  const counts = {
    All: orders.length,
    Pending: orders.filter(o => o.status === 'Pending').length,
    Ready: orders.filter(o => o.status === 'Ready').length,
    Done: orders.filter(o => o.status === 'Done').length,
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const filteredOrders =
    activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter);

  const advanceStatus = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        if (o.status === 'Pending') return { ...o, status: 'Ready' as OrderStatus };
        if (o.status === 'Ready') return { ...o, status: 'Done' as OrderStatus };
        return o;
      }),
    );
  };

  const getActionButton = (order: Order) => {
    if (order.status === 'Pending' || order.status === 'Ready') {
      const label = order.status === 'Pending' ? 'Mark Ready' : 'Mark Complete';
      return (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => advanceStatus(order.id)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3E5F8D', '#648EC9', '#3E5F8D']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.actionBtnGradient}
          >
            <Text style={styles.actionBtnText}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <View style={[styles.actionBtnGradient, { backgroundColor: '#d1d5db' }]}>
        <Text style={[styles.actionBtnText, { color: '#9ca3af' }]}>Completed</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1AD" />

      {/* Golden gradient header */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Pre-Orders</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Have a Sip of Matcha · Today, 11AM–3PM</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Stat Pills */}
        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{counts.All}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{counts.Pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>${totalRevenue}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['All', 'Pending', 'Ready', 'Done'] as FilterTab[]).map(tab => {
            const selected = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, selected && styles.filterTabSelected]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterTabText, selected && styles.filterTabTextSelected]}>
                  {tab} ({counts[tab]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order Cards */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No orders in this category</Text>
          </View>
        ) : (
          filteredOrders.map(order => {
            const badge = STATUS_BADGE_COLORS[order.status];
            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Order header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  </View>
                  <View style={styles.orderHeaderRight}>
                    <Text style={styles.orderTime}>{order.time}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.orderItems}>
                  {order.items.map((item, idx) => (
                    <Text key={idx} style={styles.orderItemText}>
                      {item.name} x{item.quantity}
                    </Text>
                  ))}
                </View>

                {/* Footer: total + action */}
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
                  {getActionButton(order)}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  /* Header */
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF1AD',
    borderBottomWidth: 1,
    borderBottomColor: '#B4B4B4',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    paddingLeft: 36,
  },

  scroll: { flex: 1, paddingHorizontal: 16 },

  /* Stat Pills */
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  statPill: {
    backgroundColor: '#2E4A7A',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minWidth: 93,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12.5,
    elevation: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c5d4e8',
    marginTop: 2,
  },

  /* Filter Tabs */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 14,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
    backgroundColor: '#e3e9f5',
  },
  filterTabSelected: {
    backgroundColor: '#2E4A7A',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E4A7A',
  },
  filterTabTextSelected: {
    color: '#fff',
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },

  /* Order Cards */
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Order Items */
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginBottom: 10,
    gap: 4,
  },
  orderItemText: {
    fontSize: 13,
    color: '#555',
  },

  /* Order Footer */
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  actionBtn: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
