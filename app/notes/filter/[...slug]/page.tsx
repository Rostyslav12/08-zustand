import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound } from "next/navigation";

import NotesClient from "./Notes.client";

import type { Metadata } from "next";
import { fetchNotes } from "@/lib/api/api";

const allowedTags = ["Todo", "Work", "Personal", "Meeting", "Shopping"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const requestedTag = slug[0] ?? "all";

  const tag =
    requestedTag.toLowerCase() === "all"
      ? "all"
      : allowedTags.find(
          (item) => item.toLowerCase() === requestedTag.toLowerCase()
        );

  if (!tag || slug.length !== 1) {
    return {
      title: "Notes not found | NoteHub",
      description: "The requested notes filter does not exist.",
    };
  }

  const title =
    tag === "all" ? "All notes | NoteHub" : `${tag} notes | NoteHub`;

  const description =
    tag === "all"
      ? "Browse and manage all your notes in NoteHub."
      : `Browse and manage your ${tag} notes in NoteHub.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://notehub.com/notes/filter/${encodeURIComponent(tag)}`,
      images: [
        {
          url: "https://ac.goit.global/fullstack/react/notehub-og-meta.jpg",
          width: 1200,
          height: 630,
          alt: `NoteHub — ${tag} notes`,
        },
      ],
    },
  };
}

interface NotesPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { slug } = await params;

  if (slug.length !== 1) {
    notFound();
  }

  const requestedTag = slug[0];

  if (!requestedTag) {
    notFound();
  }

  const tag =
    requestedTag.toLowerCase() === "all"
      ? "all"
      : allowedTags.find(
          (item) => item.toLowerCase() === requestedTag.toLowerCase()
        );

  if (!tag) {
    notFound();
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["notes", { page: 1, search: "", tag }],
    queryFn: () =>
      fetchNotes({
        page: 1,
        perPage: 12,
        tag,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotesClient tag={tag} />
    </HydrationBoundary>
  );
}
