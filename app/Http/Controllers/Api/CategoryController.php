<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    // View all categories
    public function index()
    {
        return response()->json(
            Category::withCount('announcements')->latest()->get()
        );
    }

    // Create category - Admin only
    public function store(Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403, 'Only administrators can create categories.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
        ]);

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $category,
        ], 201);
    }

    // View one category
    public function show(Category $category)
    {
        return response()->json(
            $category->loadCount('announcements')
        );
    }

    // Update category - Admin only
    public function update(Request $request, Category $category)
    {
        abort_unless($request->user()->isAdmin(), 403, 'Only administrators can update categories.');

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $category,
        ]);
    }

    // Delete category - Admin only
    public function destroy(Request $request, Category $category)
    {
        abort_unless($request->user()->isAdmin(), 403, 'Only administrators can delete categories.');

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}