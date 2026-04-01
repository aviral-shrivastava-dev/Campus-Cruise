const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    college: String!
    phone: String!
    role: [String!]!
    vehicleInfo: VehicleInfo
    averageRating: Float
    createdAt: String!
  }

  type VehicleInfo {
    make: String
    model: String
    color: String
    licensePlate: String
  }

  type Ride {
    id: ID!
    driver: User!
    source: String!
    destination: String!
    departureTime: String!
    availableSeats: Int!
    totalSeats: Int!
    status: String!
    bookings: [Booking!]
    createdAt: String!
  }

  type Booking {
    id: ID!
    ride: Ride!
    passenger: User!
    status: String!
    createdAt: String!
  }

  type Review {
    id: ID!
    ride: Ride!
    reviewer: User!
    driver: User!
    rating: Int!
    comment: String
    createdAt: String!
  }

  type Query {
    me: User
    user(id: ID!): User
    rides(source: String, destination: String, date: String): [Ride!]!
    ride(id: ID!): Ride
    booking(id: ID!): Booking
    myBookings: [Booking!]!
    driverReviews(driverId: ID!): [Review!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): User!
    createRide(input: CreateRideInput!): Ride!
    cancelRide(id: ID!): Ride!
    bookRide(rideId: ID!): Booking!
    cancelBooking(id: ID!): Booking!
    createReview(input: CreateReviewInput!): Review!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    college: String!
    phone: String!
    role: [String!]!
    vehicleInfo: VehicleInfoInput
  }

  input UpdateProfileInput {
    name: String
    college: String
    phone: String
    vehicleInfo: VehicleInfoInput
  }

  input VehicleInfoInput {
    make: String
    model: String
    color: String
    licensePlate: String
  }

  input CreateRideInput {
    source: String!
    destination: String!
    departureTime: String!
    availableSeats: Int!
  }

  input CreateReviewInput {
    rideId: ID!
    driverId: ID!
    rating: Int!
    comment: String
  }
`;

module.exports = typeDefs;
