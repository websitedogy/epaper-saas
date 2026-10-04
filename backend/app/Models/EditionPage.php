<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EditionPage extends Model
{
    use HasUuids;

    protected $fillable = [
        'edition_id',
        'page_number',
        'image_path',
        'width',
        'height',
    ];

    public function edition()
    {
        return $this->belongsTo(Edition::class);
    }
}
