<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Edition extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'name',
        'edition_date',
        'original_pdf',
        'total_pages',
        'processing_progress',
        'slug',
        'status',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'edition_date' => 'date',
        'total_pages' => 'integer',
        'processing_progress' => 'integer',
    ];

    public function pages()
    {
        return $this->hasMany(EditionPage::class)->orderBy('page_number');
    }
}
