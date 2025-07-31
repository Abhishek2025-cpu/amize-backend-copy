// app/api/users/[id]/uploads/route.ts

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

interface Params {
    params: {
        id: string;
    };
}

export async function GET(request: Request, { params }: Params) {
    try {
        const { id } = params;
        const authUser = await getAuthUser(request);
        const { searchParams } = new URL(request.url);

        // Check if user has permission to view uploads
        if (!authUser || (authUser.userId !== id)) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 403 }
            );
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const uploadType = searchParams.get('type') || undefined;
        const status = searchParams.get('status') || undefined;

        const skip = (page - 1) * limit;

        // Build where clause
        let whereClause: any = { userId: id };
        if (uploadType) {
            whereClause.uploadType = uploadType;
        }
        if (status) {
            whereClause.status = status;
        }

        // Get uploads
        const uploads = await prisma.upload.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: limit,
        });

        // Get total count
        const total = await prisma.upload.count({
            where: whereClause,
        });

        return NextResponse.json({
            success: true,
            uploads,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}