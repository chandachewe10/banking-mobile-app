import { View, Text, StyleSheet } from 'react-native';

export default function CardComponent() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sample Card</Text>
      <Text>This is a basic! card component with shadow effects</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});