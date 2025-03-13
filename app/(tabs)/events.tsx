import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { API_URL } from '../config/api';

interface Event {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  const fetchEvents = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      const response = await fetch(`${API_URL}/api/events`, {
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      if (isMounted.current) {
        setEvents(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching events:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const loadEvents = async () => {
      cleanup = await fetchEvents();
    };

    loadEvents();

    return () => {
      isMounted.current = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [fetchEvents]);

  const renderEvent = useCallback(({ item }: { item: Event }) => {
    if (!item || !item._id) return null;
    
    return (
      <View style={styles.eventCard}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDescription}>{item.description}</Text>
        <Text style={styles.eventDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item: Event) => item._id, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <FlatList
        ref={flatListRef}
        data={events}
        renderItem={renderEvent}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={false}
        maxToRenderPerBatch={5}
        windowSize={3}
        initialNumToRender={5}
        onEndReachedThreshold={0.5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 12,
    color: '#999',
  },
}); 