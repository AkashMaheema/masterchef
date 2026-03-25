"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Minus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NewRecipePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [image, setImage] = useState("")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    timeToCook: 30,
    servings: 4,
  })

  const [ingredients, setIngredients] = useState([{ name: "", amount: 1, unit: "cup" }])
  const [steps, setSteps] = useState([{ description: "" }])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const data = new FormData()
    data.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data })
      const json = await res.json()
      if (res.ok) {
        setImage(json.url)
        toast.success("Image uploaded successfully!")
      } else {
        toast.error("Upload failed")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image, ingredients, steps })
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Recipe created!")
      router.push("/admin/recipes")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to create recipe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/recipes" className="inline-flex items-center text-sm text-muted-foreground hover:text-orange-500 mb-4 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recipes
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Basic Info</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recipe Title</Label>
              <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Delicious Pasta..." />
            </div>
            <div className="space-y-2">
              <Label>Image Upload</Label>
              <div className="flex gap-2">
                <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="cursor-pointer file:text-orange-500 file:bg-orange-50 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-2" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="A short description of the recipe..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
               <Label>Difficulty</Label>
               <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                 <option value="EASY">Easy</option>
                 <option value="MEDIUM">Medium</option>
                 <option value="HARD">Hard</option>
               </select>
            </div>
            <div className="space-y-2">
              <Label>Time to Cook (mins)</Label>
              <Input type="number" required min={1} value={formData.timeToCook} onChange={e => setFormData({...formData, timeToCook: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Servings</Label>
              <Input type="number" required min={1} value={formData.servings} onChange={e => setFormData({...formData, servings: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
             <h2 className="text-xl font-semibold">Ingredients</h2>
             <Button type="button" variant="outline" size="sm" onClick={() => setIngredients([...ingredients, { name: "", amount: 1, unit: "g" }])}>
               <Plus className="mr-2 h-4 w-4" /> Add
             </Button>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input placeholder="Amount" type="number" step="0.1" required value={ing.amount} onChange={e => {
                const newIng = [...ingredients];
                newIng[idx].amount = parseFloat(e.target.value) || 0;
                setIngredients(newIng);
              }} className="w-24" />
              <Input placeholder="Unit" required value={ing.unit} onChange={e => {
                const newIng = [...ingredients];
                newIng[idx].unit = e.target.value;
                setIngredients(newIng);
              }} className="w-24" />
              <Input placeholder="Ingredient Name" required value={ing.name} onChange={e => {
                const newIng = [...ingredients];
                newIng[idx].name = e.target.value;
                setIngredients(newIng);
              }} className="flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} disabled={ingredients.length === 1}>
                <Minus className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
             <h2 className="text-xl font-semibold">Instructions</h2>
             <Button type="button" variant="outline" size="sm" onClick={() => setSteps([...steps, { description: "" }])}>
               <Plus className="mr-2 h-4 w-4" /> Add
             </Button>
          </div>
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="mt-2 text-sm font-bold text-slate-400 w-6 text-right">{idx + 1}.</div>
              <Textarea placeholder={`Step ${idx + 1} instructions`} required value={step.description} onChange={e => {
                const newSteps = [...steps];
                newSteps[idx].description = e.target.value;
                setSteps(newSteps);
              }} className="flex-1" rows={2} />
              <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => setSteps(steps.filter((_, i) => i !== idx))} disabled={steps.length === 1}>
                <Minus className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button type="submit" className="w-full h-12 text-lg bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
            {loading ? "Creating Recipe..." : "Save Recipe"}
          </Button>
        </div>
      </form>
    </div>
  )
}
