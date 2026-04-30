import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../hooks/useColors";

interface Category {
  id: string;
  label: string;
  labelAr: string;
  image: ImageSourcePropType;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: "goat",
    label: "Bakra",
    labelAr: "بکرا",
    image: require("../assets/images/cat_goat.png"),
    color: "#926B1F",
  },
  {
    id: "cow",
    label: "Cow",
    labelAr: "گائے",
    image: require("../assets/images/cat_cow.png"),
    color: "#D4AF37",
  },
  {
    id: "sheep",
    label: "Sheep",
    labelAr: "بھیڑ",
    image: require("../assets/images/cat_sheep.png"),
    color: "#7C6EF0",
  },
  {
    id: "dumba",
    label: "Dumba",
    labelAr: "دنبہ",
    image: require("../assets/images/cat_dumba.png"),
    color: "#E67E22",
  },
  {
    id: "camel",
    label: "Camel",
    labelAr: "اونٹ",
    image: require("../assets/images/cat_camel.png"),
    color: "#B8902A",
  },
  {
    id: "buffalo",
    label: "Buffalo",
    labelAr: "بھینس",
    image: require("../assets/images/cat_buffalo.png"),
    color: "#4A7FB5",
  },
];

interface CategoryGridProps {
  onSelect: (category: string) => void;
  selected: string | null;
}

export function CategoryGrid({ onSelect, selected }: CategoryGridProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingRight: 4 }}
    >
      {CATEGORIES.map((cat) => (
        <CategoryItem
          key={cat.id}
          category={cat}
          isSelected={selected === cat.id}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onSelect(cat.id === selected ? "" : cat.id);
          }}
        />
      ))}
    </ScrollView>
  );
}

function CategoryItem({
  category,
  isSelected,
  onPress,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.item,
          {
            backgroundColor: isSelected
              ? category.color + "22"
              : colors.navyLight,
            borderColor: isSelected ? category.color : colors.border,
            borderWidth: isSelected ? 1.5 : 1,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: category.color + "18" },
          ]}
        >
          <Image
            source={category.image}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </View>
        <Text
          style={[
            styles.label,
            { color: isSelected ? category.color : colors.foreground },
          ]}
        >
          {category.label}
        </Text>
        <Text style={[styles.labelAr, { color: colors.mutedForeground }]}>
          {category.labelAr}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 82,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  animalImage: {
    width: 36,
    height: 36,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  labelAr: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
