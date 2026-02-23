import { PropertyCard } from "@/types/card";

export const propertyCards: PropertyCard[] = [
    {
        id: "5",
        name: "Atlantic Avenue",
        category: "property",
        bankValue: 3,
        copies: 3,
        color: "bg-yellow-300",
        propertyGroup: "yellow",
        setSize: 3,
        rentByCount: [2, 4, 6]
    },
    {
        id: "6",
        name: "B. & O. Railroad",
        category: "property",
        bankValue: 2,
        copies: 3,
        color: "bg-black",
        propertyGroup: "railroad",
        setSize: 4,
        rentByCount: [1, 2, 3, 4]
    },
]