"use client";

import { attendanceSchema, istDate } from "@townplay/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { use, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

function Sheet({ batchId }: { batchId: string }) {
  const t = useTranslations("ownerMemberships");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [date, setDate] = useState(istDate());
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const sheet = useQuery({
    queryKey: ["attendance", batchId, date],
    queryFn: () => api.get(`/owner/batches/${batchId}/attendance?date=${date}`, attendanceSchema),
  });
  const save = useMutation({
    mutationFn: (present: string[]) =>
      api.send("PUT", `/owner/batches/${batchId}/attendance`, attendanceSchema, { date, present }),
    onSuccess: (data) => {
      queryClient.setQueryData(["attendance", batchId, date], data);
      setChanges({});
    },
  });

  const members = sheet.data?.members ?? [];
  const isPresent = (id: string, saved: boolean) => changes[id] ?? saved;
  const present = members.filter((m) => isPresent(m.membershipId, m.present));

  return (
    <section className="space-y-4 pt-4">
      <h1 className="text-2xl font-bold">
        {sheet.data ? t("attendanceTitle", { title: sheet.data.batchTitle }) : t("attendance")}
      </h1>
      {sheet.data && (
        <Link
          href={`/owner/venues/${sheet.data.venueId}/memberships`}
          className="text-sm text-primary underline"
        >
          {t("title")}
        </Link>
      )}
      <Field label={t("date")}>
        <Input
          type="date"
          max={istDate()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setChanges({});
          }}
        />
      </Field>
      {sheet.isPending && <p className="text-muted-foreground">{tc("loading")}</p>}
      {sheet.isError && <p className="text-destructive">{tc("error")}</p>}
      {sheet.data && !sheet.data.scheduled && (
        <p className="text-sm text-amber-700">{t("notScheduled")}</p>
      )}
      {sheet.data && members.length === 0 && (
        <p className="text-muted-foreground">{t("noRoster")}</p>
      )}
      {members.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border">
            {members.map((m) => (
              <li key={m.membershipId} className="p-3">
                <Checkbox
                  label={`${m.name} · ${m.phone}`}
                  checked={isPresent(m.membershipId, m.present)}
                  onChange={(e) =>
                    setChanges((c) => ({ ...c, [m.membershipId]: e.target.checked }))
                  }
                />
              </li>
            ))}
          </ul>
          <p className="text-sm">
            {t("presentCount", { count: present.length, total: members.length })}
          </p>
          <FormError error={save.error} labels={{}} />
          <Button
            className="w-full"
            disabled={save.isPending}
            onClick={() => save.mutate(present.map((m) => m.membershipId))}
          >
            {save.isSuccess && Object.keys(changes).length === 0 ? t("saved") : t("saveAttendance")}
          </Button>
        </>
      )}
    </section>
  );
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AuthGate>{() => <Sheet batchId={id} />}</AuthGate>;
}
