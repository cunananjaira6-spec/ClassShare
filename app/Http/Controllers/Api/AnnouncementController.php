<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    // View announcements based on user role
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Announcement::with(['user:id,name', 'category:id,name'])
            ->latest();

        if ($user->isStudent()) {
            $query->where('status', 'published');
        } elseif ($user->isTeacher()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->get());
    }

    // Create announcement - Teacher and Admin
    public function store(Request $request)
    {
        $user = $request->user();

        abort_unless(
            $user->isTeacher() || $user->isAdmin(),
            403,
            'Only teachers and administrators can create announcements.'
        );

        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
        ]);

        $announcement = Announcement::create([
            'user_id' => $user->id,
            'category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Announcement created successfully as draft.',
            'announcement' => $announcement->load(['user:id,name', 'category:id,name']),
        ], 201);
    }

    // View one announcement
    public function show(Request $request, Announcement $announcement)
    {
        $user = $request->user();

        if ($user->isStudent()) {
            abort_unless(
                $announcement->status === 'published',
                403,
                'You cannot view unpublished announcements.'
            );
        }

        if ($user->isTeacher()) {
            abort_unless(
                $announcement->user_id === $user->id,
                403,
                'You can only view your own announcements.'
            );
        }

        return response()->json(
            $announcement->load(['user:id,name', 'category:id,name'])
        );
    }

    // Update announcement - Owner Teacher or Admin
    public function update(Request $request, Announcement $announcement)
    {
        $user = $request->user();

        $this->authorizeManagement($user, $announcement);

        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
        ]);

        $announcement->update($validated);

        return response()->json([
            'message' => 'Announcement updated successfully.',
            'announcement' => $announcement->load(['user:id,name', 'category:id,name']),
        ]);
    }

    // Delete announcement - Owner Teacher or Admin
    public function destroy(Request $request, Announcement $announcement)
    {
        $this->authorizeManagement($request->user(), $announcement);

        $announcement->delete();

        return response()->json([
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    // Publish announcement - Owner Teacher or Admin
    public function publish(Request $request, Announcement $announcement)
    {
        $this->authorizeManagement($request->user(), $announcement);

        if ($announcement->status === 'published') {
            return response()->json([
                'message' => 'Announcement is already published.',
            ]);
        }

        $announcement->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'message' => 'Announcement published successfully.',
            'announcement' => $announcement->load(['user:id,name', 'category:id,name']),
        ]);
    }

    // Check if user can manage an announcement
    private function authorizeManagement($user, Announcement $announcement): void
    {
        abort_unless(
            $user->isAdmin() ||
            ($user->isTeacher() && $announcement->user_id === $user->id),
            403,
            'You are not allowed to manage this announcement.'
        );
    }
}