import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "../api/client";

export function CourseFormPage() {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const api = useApi();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { title, description, priceCents };
    if (isNew) {
      await api.post("/api/admin/courses", body);
    } else {
      await api.put(`/api/admin/courses/${id}`, body);
    }
    navigate("/cursos");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-3">
      <h1 className="text-2xl font-bold">{isNew ? "Novo curso" : "Editar curso"}</h1>
      <input
        placeholder="Título"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded p-2"
      />
      <textarea
        placeholder="Descrição (mín. 10 caracteres)"
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded p-2"
      />
      <input
        type="number"
        min={0}
        required
        value={priceCents}
        onChange={(e) => setPriceCents(Number(e.target.value))}
        className="w-full border rounded p-2"
      />
      <button className="bg-black text-white px-4 py-2 rounded">Salvar</button>
    </form>
  );
}
