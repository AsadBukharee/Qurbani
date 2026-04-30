import type { ApiAnimal, ApiBoli, ApiBid, ApiCoupon, ApiUser } from "./api";
import type { AnimalListing, CouponCode, User } from "@/contexts/AppContext";
import type { BoliListing, Bid } from "@/contexts/BoliContext";

export function mapUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    role: (u.role === "seller" ? "seller" : "buyer") as User["role"],
    avatar: u.avatar ?? undefined,
    preferredLanguage: (u.preferred_language as "en" | "ur") || "en",
  };
}

export function mapAnimal(a: ApiAnimal): AnimalListing {
  const sellerPhone = a.seller?.phone ?? "";
  return {
    id: a.id,
    title: a.title,
    category: a.category as AnimalListing["category"],
    animalProperty: (a.animal_property ?? undefined) as AnimalListing["animalProperty"],
    price: Number(a.price) || 0,
    weight: Number(a.weight) || 0,
    age: a.age,
    breed: a.breed,
    city: a.city,
    province: a.province || "",
    district: a.district || "",
    streetAddress: a.street_address || "",
    latitude: a.latitude ? Number(a.latitude) : null,
    longitude: a.longitude ? Number(a.longitude) : null,
    description: a.description,
    images: a.images && a.images.length > 0 ? a.images : [`${a.category}_featured`],
    coverImageIndex: a.cover_image_index ?? 0,
    keywords: a.keywords || [],
    seller: {
      id: a.seller?.id ?? "",
      name: a.seller?.name ?? "Seller",
      phone: sellerPhone,
      whatsapp: sellerPhone,
      rating: 5.0,
      totalSales: 0,
    },
    status: a.status || "published",
    createdAt: (a.created_at ?? "").split("T")[0] || a.created_at,
    publishedAt: a.published_at || null,
    scheduledAt: a.scheduled_at || null,
    isFeatured: !!a.is_featured,
  };
}

export function mapCoupon(c: ApiCoupon): CouponCode {
  return {
    id: c.id,
    sellerId: c.seller,
    code: c.code,
    discount: Number(c.discount) || 0,
    isActive: !!c.is_active,
    createdAt: c.created_at ?? new Date().toISOString(),
  };
}

export function mapBoli(b: ApiBoli): BoliListing {
  return {
    id: b.id,
    animalTitle: b.animal_title,
    category: (b.category === "buffalo" ? "cow" : b.category) as BoliListing["category"],
    imageKey: b.image_key || `${b.category}_featured`,
    city: b.city,
    weight: b.weight,
    age: b.age,
    breed: b.breed,
    description: b.description,
    sellerId: b.seller?.id ?? "",
    sellerName: b.seller?.name ?? "Seller",
    sellerPhone: b.seller?.phone ?? "",
    startingPrice: Number(b.starting_price) || 0,
    currentPrice: Number(b.current_price) || 0,
    minIncrement: Number(b.min_increment) || 500,
    startTime: b.start_time,
    endTime: b.end_time,
    duration: b.duration,
    status: b.status,
    totalBids: Number(b.total_bids) || 0,
    winnerId: b.winner?.id,
    winnerName: b.winner?.name,
  };
}

export function mapBid(boliId: string, b: ApiBid): Bid {
  return {
    id: b.id,
    boliId,
    userId: b.user?.id ?? "",
    userName: b.user?.name ?? "Bidder",
    amount: Number(b.amount) || 0,
    timestamp: b.created_at ?? b.timestamp ?? new Date().toISOString(),
  };
}
