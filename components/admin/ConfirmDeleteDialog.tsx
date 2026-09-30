"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";

/**
 * Exclusão de alto impacto exige digitar o nome do item (seção 1.3/5.1).
 */
export function ConfirmDeleteDialog({
  itemName,
  onConfirm,
  open,
  onOpenChange,
}: {
  itemName: string;
  onConfirm: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Excluir &quot;{itemName}&quot;?</DialogTitle>
        <p className="text-sm text-textSecondary mb-3">
          Essa ação não pode ser desfeita. Alunos matriculados perderão acesso ao conteúdo.
          Digite o nome do curso para confirmar.
        </p>
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={itemName} />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={typed !== itemName || loading}
            onClick={async () => {
              setLoading(true);
              try {
                await onConfirm();
              } finally {
                setLoading(false);
                onOpenChange(false);
              }
            }}
          >
            {loading ? "Excluindo..." : "Excluir definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
