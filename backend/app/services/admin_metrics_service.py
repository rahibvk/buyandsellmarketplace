from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import timedelta
from typing import List, Dict, Any, Optional

class AdminMetricsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_users_by_region(self, days: int, region: Optional[str] = None):
        interval_query = f"interval '{days} days'"
        # Construct WHERE clause for region
        region_clause = "AND region = :region" if region else ""
        
        query = text(f"""
            SELECT 
                COALESCE(region, 'Unknown') as region, 
                COALESCE(city, 'Unknown') as city, 
                COUNT(*) as user_count,
                COUNT(*) FILTER (WHERE created_at >= NOW() - {interval_query}) as new_users
            FROM users
            WHERE 1=1 {region_clause}
            GROUP BY region, city
            ORDER BY user_count DESC
        """)
        
        params = {"region": region} if region else {}
        result = await self.db.execute(query, params)
        return [dict(row._mapping) for row in result]

    async def get_listings_by_region(self, days: int, region: Optional[str] = None):
        interval_query = f"interval '{days} days'"
        region_clause = "AND u.region = :region" if region else ""
        
        query = text(f"""
            SELECT 
                COALESCE(u.region, 'Unknown') as region,
                COALESCE(u.city, 'Unknown') as city,
                COUNT(*) FILTER (WHERE l.status = 'live') as live_count,
                COUNT(*) FILTER (WHERE l.status = 'draft') as draft_count,
                COUNT(*) FILTER (WHERE l.status = 'sold') as sold_count,
                COUNT(*) FILTER (WHERE l.status = 'hidden') as hidden_count,
                COUNT(*) FILTER (WHERE l.created_at >= NOW() - {interval_query}) as new_listings
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE 1=1 {region_clause}
            GROUP BY u.region, u.city
            ORDER BY live_count DESC
        """)
        
        params = {"region": region} if region else {}
        result = await self.db.execute(query, params)
        return [dict(row._mapping) for row in result]

    async def get_listings_by_category(self, days: int, region: Optional[str] = None):
        interval_query = f"interval '{days} days'"
        region_clause = "AND u.region = :region" if region else ""
        
        query = text(f"""
            SELECT 
                l.category,
                COUNT(*) FILTER (WHERE l.status = 'live') as live_count,
                COUNT(*) FILTER (WHERE l.status = 'sold') as sold_count,
                COUNT(*) FILTER (WHERE l.created_at >= NOW() - {interval_query}) as new_listings
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE 1=1 {region_clause}
            GROUP BY l.category
            ORDER BY live_count DESC
        """)
        
        params = {"region": region} if region else {}
        result = await self.db.execute(query, params)
        return [dict(row._mapping) for row in result]

    async def get_activity(self, days: int, region: Optional[str] = None, city: Optional[str] = None):
        interval_query = f"interval '{days} days'"
        where_clauses = []
        params = {}
        
        if region:
            where_clauses.append("region = :region")
            params["region"] = region
        if city:
            where_clauses.append("city = :city")
            params["city"] = city
            
        where_sql = "AND " + " AND ".join(where_clauses) if where_clauses else ""
        
        query = text(f"""
            SELECT 
                event_type,
                COUNT(*) as count
            FROM events
            WHERE created_at >= NOW() - {interval_query}
            {where_sql}
            GROUP BY event_type
            ORDER BY count DESC
        """)
        
        result = await self.db.execute(query, params)
        return [dict(row._mapping) for row in result]

    async def get_supply_demand(self, days: int, region: Optional[str] = None, category: Optional[str] = None):
        interval_query = f"interval '{days} days'"
        
        # Supply: New LIVE listings in period
        # Demand: View Listing events in period
        
        # We need to compute supply and demand per (region, category)
        # Note: Event does rely on listing_id to get category if not stored in metadata.
        # But events table has region/city directly populated (assumed from task desc "events.region").
        # However, for demand we want to know what category was viewed. 
        # Ideally events have metadata -> category, OR we join listing.
        
        # Let's try joining listing for events to get category.
        
        params = {}
        filters = []
        if region:
            filters.append("u.region = :region")
            params["region"] = region
            
        # This is a complex query. Let's simplify: 
        # Return summary by Category (and Region if provided, or grouped by region)
        # Task says: Resp [{region, category, supply, demand, ratio}]
        
        # Supply CTE
        supply_query = f"""
            SELECT 
                u.region,
                l.category,
                COUNT(*) as supply_count
            FROM listings l
            JOIN users u ON l.seller_id = u.id
            WHERE l.created_at >= NOW() - {interval_query}
            AND l.status = 'live'
            GROUP BY u.region, l.category
        """
        
        # Demand CTE (views)
        demand_query = f"""
            SELECT 
                e.region,
                l.category,
                COUNT(*) as demand_count
            FROM events e
            JOIN listings l ON e.listing_id = l.id
            WHERE e.event_type = 'view_listing'
            AND e.created_at >= NOW() - {interval_query}
            GROUP BY e.region, l.category
        """
        
        # Combine
        full_query = text(f"""
            WITH supply AS ({supply_query}),
                 demand AS ({demand_query})
            SELECT 
                COALESCE(s.region, d.region) as region,
                COALESCE(s.category, d.category) as category,
                COALESCE(s.supply_count, 0) as supply_count,
                COALESCE(d.demand_count, 0) as demand_count,
                CASE 
                    WHEN COALESCE(s.supply_count, 0) = 0 THEN 0 
                    ELSE COALESCE(d.demand_count, 0)::float / s.supply_count 
                END as demand_per_supply
            FROM supply s
            FULL OUTER JOIN demand d ON s.region = d.region AND s.category = d.category
            WHERE 1=1
            { 'AND ' + ' AND '.join(filters).replace('u.region', 'COALESCE(s.region, d.region)') if filters else '' }
            ORDER BY demand_per_supply DESC
        """)

        # Adjustment: filtering in the final WHERE clause requires careful alias usage.
        # If region is passed, we filter the result.
        
        # Re-map params
        
        result = await self.db.execute(full_query, params)
        return [dict(row._mapping) for row in result]
