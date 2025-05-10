<View style={styles.container}>
    <FlatList
        data={entries}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        renderItem={({ item }) => (
            <View style={styles.entry}>
                <Text>Score: {item.score}</Text>
                <Text>Date: {item.created_at}</Text>
                <Text>Note: {item.note === "" ? "no notes" : item.note}</Text>
            </View>
        )}
    />
    <StatusBar style="auto" />
</View>;
