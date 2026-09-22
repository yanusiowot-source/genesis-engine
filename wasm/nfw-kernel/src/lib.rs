#![no_std]
#![no_main]

use core::arch::wasm32::*;
use core::ptr::{addr_of_mut, write};
use libm::{atan, atanh, log, sqrt};

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

fn nfw_f_js(x: f64) -> f64 {
    let u = if x < 0.0 { -x } else { x };
    if u < 1e-6 {
        let d = if u > 1e-8 { u } else { 1e-8 };
        return log(2.0 / d);
    }
    if abs(u - 1.0) < 1e-5 {
        return 1.0;
    }
    if u < 1.0 {
        let inner = 1.0 - u * u;
        let d = sqrt(if inner > 1e-12 { inner } else { 1e-12 });
        let a = if d < 0.999999 { d } else { 0.999999 };
        return atanh(a) / d;
    }
    let d = sqrt(u * u - 1.0);
    atan(d) / d
}

fn abs(v: f64) -> f64 {
    if v < 0.0 { -v } else { v }
}

fn max(a: f64, b: f64) -> f64 {
    if a > b { a } else { b }
}

fn kappa_one(x: f64, ks: f64) -> f64 {
    let u = max(abs(x), 1e-5);
    if abs(u - 1.0) < 1e-4 {
        return (2.0 * ks) / 3.0;
    }
    (2.0 * ks * (1.0 - nfw_f_js(u))) / (u * u - 1.0)
}

fn mean_one(x: f64, ks: f64) -> f64 {
    let u = max(abs(x), 1e-5);
    (4.0 * ks * (log(u / 2.0) + nfw_f_js(u))) / (u * u)
}

/// Two radii at once: F stays scalar (branches). Algebra is f64x2.
fn pair_km(x0: f64, x1: f64, ks: f64) -> (f64, f64, f64, f64) {
    let u0 = max(abs(x0), 1e-5);
    let u1 = max(abs(x1), 1e-5);
    if abs(u0 - 1.0) < 1e-4 || abs(u1 - 1.0) < 1e-4 {
        return (kappa_one(x0, ks), kappa_one(x1, ks), mean_one(x0, ks), mean_one(x1, ks));
    }
    let f0 = nfw_f_js(u0);
    let f1 = nfw_f_js(u1);
    let u = f64x2_replace_lane::<1>(f64x2_splat(u0), u1);
    let f = f64x2_replace_lane::<1>(f64x2_splat(f0), f1);
    let one = f64x2_splat(1.0);
    let uu = f64x2_mul(u, u);
    let kden = f64x2_sub(uu, one);
    let knum = f64x2_mul(f64x2_splat(2.0 * ks), f64x2_sub(one, f));
    let k = f64x2_div(knum, kden);
    let logu = f64x2_replace_lane::<1>(f64x2_splat(log(u0 / 2.0)), log(u1 / 2.0));
    let mnum = f64x2_mul(f64x2_splat(4.0 * ks), f64x2_add(logu, f));
    let m = f64x2_div(mnum, uu);
    (
        f64x2_extract_lane::<0>(k),
        f64x2_extract_lane::<1>(k),
        f64x2_extract_lane::<0>(m),
        f64x2_extract_lane::<1>(m),
    )
}

#[no_mangle]
pub extern "C" fn nfw_f(x: f64) -> f64 {
    nfw_f_js(x)
}

#[no_mangle]
pub extern "C" fn nfw_kappa(x: f64, ks: f64) -> f64 {
    kappa_one(x, ks)
}

#[no_mangle]
pub extern "C" fn nfw_mean_kappa(x: f64, ks: f64) -> f64 {
    mean_one(x, ks)
}

#[no_mangle]
pub extern "C" fn nfw_einstein_x(ks: f64) -> f64 {
    let mut lo = 0.15;
    let mut hi = 14.0;
    let mut i = 0;
    while i < 22 {
        let mid = (lo + hi) * 0.5;
        if mean_one(mid, ks) > 1.0 {
            lo = mid;
        } else {
            hi = mid;
        }
        i += 1;
    }
    (lo + hi) * 0.5
}

const CAP: usize = 64;
static mut KAPPA: [f64; CAP] = [0.0; CAP];
static mut MEAN: [f64; CAP] = [0.0; CAP];

#[no_mangle]
pub extern "C" fn nfw_kappa_ptr() -> *mut f64 {
    addr_of_mut!(KAPPA).cast()
}

#[no_mangle]
pub extern "C" fn nfw_mean_ptr() -> *mut f64 {
    addr_of_mut!(MEAN).cast()
}

/// x_i = x0 + (x1 − x0) · i / n for i = 1 ..= n. SIMD pairs, scalar tail.
#[no_mangle]
pub extern "C" fn nfw_fill_grid(n: u32, x0: f64, x1: f64, ks: f64) -> u32 {
    let count = if n as usize > CAP { CAP } else { n as usize };
    if count == 0 {
        return 0;
    }
    let span = x1 - x0;
    let nf = n as f64;
    let mut i = 1usize;
    while i + 1 <= count {
        let xa = x0 + span * (i as f64) / nf;
        let xb = x0 + span * ((i + 1) as f64) / nf;
        let (ka, kb, ma, mb) = pair_km(xa, xb, ks);
        unsafe {
            write(addr_of_mut!(KAPPA).cast::<f64>().add(i - 1), ka);
            write(addr_of_mut!(KAPPA).cast::<f64>().add(i), kb);
            write(addr_of_mut!(MEAN).cast::<f64>().add(i - 1), ma);
            write(addr_of_mut!(MEAN).cast::<f64>().add(i), mb);
        }
        i += 2;
    }
    while i <= count {
        let x = x0 + span * (i as f64) / nf;
        unsafe {
            write(addr_of_mut!(KAPPA).cast::<f64>().add(i - 1), kappa_one(x, ks));
            write(addr_of_mut!(MEAN).cast::<f64>().add(i - 1), mean_one(x, ks));
        }
        i += 1;
    }
    count as u32
}
