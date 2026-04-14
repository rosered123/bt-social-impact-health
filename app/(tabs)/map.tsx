import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';

import { EventWithBusiness, listMappableEvents } from '@/services/api';

const AUSTIN_REGION: Region = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MapScreen() {
  const [events, setEvents] = useState<EventWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventWithBusiness | null>(null);
  const slideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    listMappableEvents()
      .then(setEvents)
      .catch((e) => setError(e?.message ?? 'Could not load events.'))
      .finally(() => setLoading(false));
  }, []);

  const showCard = (event: EventWithBusiness) => {
    setSelected(event);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  const hideCard = () => {
    Animated.timing(slideAnim, { toValue: 120, duration: 200, useNativeDriver: true }).start(() =>
      setSelected(null)
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        {!loading && !error && (
          <Text style={styles.subtitle}>{events.length} pop-up{events.length !== 1 ? 's' : ''} near Austin</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading pop-ups…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={AUSTIN_REGION}
            showsUserLocation
            showsMyLocationButton
            onPress={hideCard}
          >
            {events.map((event) => (
              <Marker
                key={event.id}
                coordinate={{ latitude: event.latitude!, longitude: event.longitude! }}
                onPress={() => showCard(event)}
              >
                <View style={styles.pin}>
                  <Text style={styles.pinText}>🏪</Text>
                </View>
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle} numberOfLines={1}>{event.business_name}</Text>
                    <Text style={styles.calloutSub} numberOfLines={1}>{event.event_name}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {events.length === 0 && (
            <View style={styles.emptyOverlay}>
              <Text style={styles.emptyText}>No pop-ups with locations yet.</Text>
              <Text style={styles.emptyHint}>Businesses need to add coordinates when creating events.</Text>
            </View>
          )}

          {selected && (
            <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
              <TouchableOpacity style={styles.cardClose} onPress={hideCard}>
                <Text style={styles.cardCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.cardBusiness}>{selected.business_name}</Text>
              <Text style={styles.cardEvent}>{selected.event_name}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>📅</Text>
                <Text style={styles.cardMeta}>{formatDate(selected.event_date)}</Text>
              </View>
              {selected.location ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardIcon}>📍</Text>
                  <Text style={styles.cardMeta}>{selected.location}</Text>
                </View>
              ) : null}
              <View style={[styles.cardRow, { marginTop: 4 }]}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(selected.status) }]}>
                  <Text style={styles.statusText}>{selected.status.replace('_', ' ')}</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'open': return '#22c55e';
    case 'closing_soon': return '#f59e0b';
    case 'sold_out':
    case 'closed':
    case 'cancelled': return '#ef4444';
    default: return '#3b82f6';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: '#FFF1AD' },
  title: { fontSize: 24, fontWeight: '900', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stateText: { fontSize: 13, color: '#555' },
  errorText: { fontSize: 13, color: '#b91c1c', fontWeight: '600' },

  mapContainer: { flex: 1 },
  map: { flex: 1 },

  pin: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinText: { fontSize: 18 },

  callout: {
    backgroundColor: '#fff', borderRadius: 8, padding: 8,
    minWidth: 140, maxWidth: 200,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  calloutTitle: { fontWeight: '800', fontSize: 13, color: '#111', marginBottom: 2 },
  calloutSub: { fontSize: 11, color: '#555' },

  emptyOverlay: {
    position: 'absolute', bottom: 32, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  emptyText: { fontWeight: '700', fontSize: 14, color: '#111', marginBottom: 4 },
  emptyHint: { fontSize: 12, color: '#666', textAlign: 'center' },

  card: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, paddingBottom: 32,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  cardClose: { position: 'absolute', top: 14, right: 16, padding: 4 },
  cardCloseText: { fontSize: 16, color: '#999' },
  cardBusiness: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 2, paddingRight: 24 },
  cardEvent: { fontSize: 14, color: '#444', marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardIcon: { fontSize: 13 },
  cardMeta: { fontSize: 13, color: '#555', flex: 1 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
});
