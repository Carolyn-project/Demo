import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Client } from 'pg';

// Create a client instance for CockroachDB using the DATABASE URL from environment variables
const client = new Client({
  connectionString: process.env.DATABASE, // Use the DATABASE URL from environment variables
  ssl: {
    rejectUnauthorized: false, // Required for CockroachCloud
  },
});

// Connect to the CockroachDB database
client.connect().catch((err) => console.error('Connection error:', err));

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  // Create a new post using raw SQL
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const query = 'INSERT INTO posts (name) VALUES ($1) RETURNING *';
        const values = [input.name];
        const res = await client.query(query, values);

        return res.rows[0]; // Return the newly created post
      } catch (error) {
        console.error('Error inserting post:', error);
        throw new Error('Error creating post');
      }
    }),

  // Get the latest post using raw SQL
  getLatest: publicProcedure.query(async () => {
    try {
      const query = 'SELECT * FROM posts ORDER BY id DESC LIMIT 1';
      const res = await client.query(query);

      return res.rows[0] ?? null; // Return the latest post or null
    } catch (error) {
      console.error('Error fetching latest post:', error);
      throw new Error('Error fetching latest post');
    }
  }),
});
