
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import type { Note } from "@/types/note";
import { deleteNote, fetchNotes } from "@/lib/api/api";

import css from "./Notes.client.module.css";

interface NotesClientProps {
  tag: string;
  page: number;
  search: string;
}

const PER_PAGE = 12;

export default function NotesClient({
  tag,
  page,
  search,
}: NotesClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState(search);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams();

    if (value.trim()) {
      params.set("search", value.trim());
    }

    params.set("page", "1");

    router.push(
      `/notes/filter/${encodeURIComponent(tag)}?${params.toString()}`
    );
  }, 500);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes", tag, page, search],
    queryFn: () =>
      fetchNotes({
        page,
        perPage: PER_PAGE,
        search,
        tag: tag === "all" ? undefined : tag,
      }),
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await deleteNote(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function handleSearch(value: string) {
    setSearchValue(value);
    debouncedSearch(value);
  }

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    params.set("page", String(nextPage));

    router.push(
      `/notes/filter/${encodeURIComponent(tag)}?${params.toString()}`
    );
  }

  if (isLoading) {
    return <p>Loading notes...</p>;
  }

  if (isError || !data) {
    return <p>Failed to load notes. Please try again.</p>;
  }

  const notes: Note[] = data.notes;
  const totalPages = data.totalPages;

  return (
    <section className={css.container}>
      <div className={css.toolbar}>
        <input
          type="search"
          value={searchValue}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search notes..."
          aria-label="Search notes"
          className={css.searchInput}
        />

        <Link href="/notes/action/create" className={css.createButton}>
          Create note +
        </Link>
      </div>

      {notes.length === 0 ? (
        <p>No notes found.</p>
      ) : (
        <ul className={css.noteList}>
          {notes.map((note) => (
            <li key={note.id} className={css.noteItem}>
              <article className={css.noteCard}>
                <h2 className={css.noteTitle}>{note.title}</h2>
                <p className={css.noteContent}>{note.content}</p>
                <p className={css.noteTag}>Tag: {note.tag}</p>

                <div className={css.noteActions}>
                  <Link
                    href={`/notes/${note.id}`}
                    className={css.detailsLink}
                  >
                    View details
                  </Link>

                  <button
                    type="button"
                    className={css.deleteButton}
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this note?"
                        )
                      ) {
                        deleteMutation.mutate(note.id);
                      }
                    }}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {deleteMutation.isError && (
        <p role="alert">Failed to delete the note.</p>
      )}

      {totalPages > 1 && (
        <nav className={css.pagination} aria-label="Notes pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}