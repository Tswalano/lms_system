/**
 * Returns only reviews where the linked employee is still active.
 * Applied at the API layer because the employee.isActive check cannot
 * be pushed into a Prisma `where` clause across a relation without a join.
 */
export function filterActiveEmployeeReviews<T extends { employee: { isActive?: boolean | null } | null }>(
    reviews: T[]
): T[] {
    return reviews.filter((r) => r.employee?.isActive !== false);
}
